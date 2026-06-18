import { Task } from '../types/task'

const VALID_TYPES = new Set(['inbox', 'todo', 'cal', 'Pj', 'id', 'nt', 'dg', 'sdl'])

const BUILT_IN_KEYS = new Set([
  't', 'id', 'created', 'event', 'start', 'due', 'done',
  'remind', 'tags', 'priority', 'parent', 'links', 'from', 'repeat',
])

function parseStatus(marker: string): Task['status'] {
  if (marker === 'x' || marker === 'X') return 'done'
  if (marker === '-') return 'cancelled'
  if (marker === '/') return 'in_progress'
  return 'active'
}

function parseType(raw: string): Task['type'] {
  if (VALID_TYPES.has(raw)) return raw as Task['type']
  return 'inbox'
}

/** Считает уровень отступа строки. Таб = 4 пробела, шаг = 4 пробела. */
export function getIndentLevel(line: string): number {
  let spaces = 0
  for (const ch of line) {
    if (ch === ' ') spaces++
    else if (ch === '\t') spaces += 4
    else break
  }
  return Math.floor(spaces / 4)
}

/** Извлекает свойства, desc и собирает Task из готовых title/status/raw */
function buildTask(
  title: string,
  status: Task['status'],
  workingStr: string,
  line: string,
  indentLevel: number,
): Task {
  // Извлечь ^[desc] до парсинга пропсов
  let desc: string | null = null
  const descMatch = workingStr.match(/\^\[([^\]]*)\]/)
  if (descMatch) {
    desc = descMatch[1]
    workingStr = workingStr.replace(descMatch[0], '').trim()
  }

  // Извлечь все [key::value] пары
  const propPattern = /\[([^\]:]+)::([^\]]*)\]/g
  const props: Record<string, string> = {}
  let match: RegExpExecArray | null

  while ((match = propPattern.exec(workingStr)) !== null) {
    props[match[1].trim()] = match[2].trim()
  }

  // Разделить встроенные ключи и customProps
  const customProps: Record<string, string> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!BUILT_IN_KEYS.has(key)) {
      customProps[key] = value
    }
  }

  const splitComma = (key: string): string[] =>
    props[key] ? props[key].split(',').map(s => s.trim()).filter(Boolean) : []

  const rawType = props['t'] ?? ''

  return {
    title,
    status,
    type: rawType ? parseType(rawType) : 'inbox',
    id: props['id'] ?? null,
    created: props['created'] ?? null,
    event: props['event'] ?? null,
    start: props['start'] ?? null,
    due: props['due'] ?? null,
    done: props['done'] ?? null,
    remind: splitComma('remind'),
    tags: splitComma('tags'),
    priority: props['priority'] != null ? Number(props['priority']) : null,
    parent: props['parent'] ?? null,
    links: splitComma('links'),
    from: splitComma('from'),
    repeat: props['repeat'] ?? null,
    desc,
    raw: line,
    indentLevel,
    customProps,
  }
}

export function parseLine(line: string): Task | null {
  const indentLevel = getIndentLevel(line)
  const trimmed = line.trimStart()

  // Комментарии — игнорируем
  if (trimmed.startsWith('//')) return null

  // Пустая строка — игнорируем
  if (trimmed === '') return null

  // Строки без префикса "- " (с учётом отступа): inbox, заголовок = весь trimmed текст
  if (!trimmed.startsWith('- ')) {
    return buildTask(trimmed, 'active', '', line, indentLevel)
  }

  // Match checkbox: - [ ], - [x], - [X], - [-], - [/]
  const checkboxMatch = trimmed.match(/^- \[([xX\-/]| )\] (.*)$/)

  // "- " без чекбокса: inbox, заголовок = текст после "- "
  if (!checkboxMatch) {
    const title = trimmed.slice(2).trim()
    return buildTask(title, 'active', '', line, indentLevel)
  }

  const statusChar = checkboxMatch[1].trim()
  const rest = checkboxMatch[2]
  const status = parseStatus(statusChar)

  // Заголовок: текст до первого [ или ^[
  const firstSpecial = rest.search(/[\[^]/)
  const title = (firstSpecial === -1 ? rest : rest.slice(0, firstSpecial)).trim()

  return buildTask(title, status, rest, line, indentLevel)
}
