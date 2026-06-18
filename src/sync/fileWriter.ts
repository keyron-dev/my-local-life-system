/**
 * Возвращает 0-based номер строки где встречается [id::${id}].
 * Возвращает -1 если не найдено.
 */
export function findTaskLineById(content: string, id: string): number {
  const needle = `[id::${id}]`
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) return i
  }
  return -1
}

/**
 * Заменяет строку с [id::${id}] на newLine.
 * Если ID не найден — возвращает исходный текст без изменений.
 */
export function updateTaskInFile(
  content: string,
  id: string,
  newLine: string,
): string {
  const lineNum = findTaskLineById(content, id)
  if (lineNum === -1) return content

  const lines = content.split('\n')
  lines[lineNum] = newLine
  return lines.join('\n')
}

/**
 * Добавляет newLine в конец файла.
 * Если файл не заканчивается на \n — сначала добавляет перенос строки.
 */
export function appendTaskToFile(content: string, newLine: string): string {
  if (content.length === 0) return newLine
  const separator = content.endsWith('\n') ? '' : '\n'
  return `${content}${separator}${newLine}`
}
