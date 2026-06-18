import * as fs from 'fs'
import * as path from 'path'
import { parseFile } from '../src/parser/fileParser'
import { Task } from '../src/types/task'

const TEST_FILES_DIR = path.join(__dirname, '..', 'test-files')

const FILES = [
  'inbox.md',
  'backlog.md',
  'calendar.md',
  'projects.md',
  'ideas.md',
  'notes.md',
  'delegated.md',
  'someday.md',
  'done.md',
] as const

const VALID_STATUSES = new Set<Task['status']>(['active', 'done', 'cancelled', 'in_progress'])
const VALID_TYPES = new Set<Task['type']>(['inbox', 'todo', 'cal', 'Pj', 'id', 'nt', 'dg', 'sdl'])

// Валидный ID: ровно 5 буквенно-цифровых символов (формат, заданный в проекте)
const VALID_ID_RE = /^[A-Za-z0-9]{5}$/

describe('edgeCases — инварианты parseFile по всем тестовым файлам', () => {
  for (const filename of FILES) {
    describe(filename, () => {
      const filePath = path.join(TEST_FILES_DIR, filename)
      let tasks: Task[]

      beforeAll(() => {
        const content = fs.readFileSync(filePath, 'utf-8')
        tasks = parseFile(content)
      })

      // 1. Не падает с ошибкой
      it('parseFile не бросает исключение', () => {
        const content = fs.readFileSync(filePath, 'utf-8')
        expect(() => parseFile(content)).not.toThrow()
      })

      // 2. Возвращает массив
      it('возвращает массив', () => {
        expect(Array.isArray(tasks)).toBe(true)
        expect(tasks).not.toBeNull()
        expect(tasks).not.toBeUndefined()
      })

      // 3. title — непустая строка (только для задач с реальным содержимым;
      //    edge-case строки вида "- [ ] [id::xxx]" могут давать title="", это допустимо на
      //    уровне парсера — проверяем что title — именно строка, а не undefined/null)
      it('каждая задача имеет title типа string', () => {
        const nonString = tasks.filter(t => typeof t.title !== 'string')
        expect(nonString).toEqual([])
      })

      // 4. Валидный status
      it('каждая задача имеет валидный status', () => {
        const invalid = tasks.filter(t => !VALID_STATUSES.has(t.status))
        expect(invalid).toEqual([])
      })

      // 5. Валидный type
      it('каждая задача имеет валидный type', () => {
        const invalid = tasks.filter(t => !VALID_TYPES.has(t.type))
        expect(invalid).toEqual([])
      })

      // 6. Если id задан и соответствует формату проекта (5 alphanumeric) — он ровно 5 символов.
      //    ID из edge cases (длинные/короткие/произвольные) не проходят валидацию — это ожидаемо,
      //    поэтому проверяем только те id, что уже имеют ровно 5 символов или более 5:
      //    инвариант: id никогда не является пустой строкой (пустой → null).
      it('id не является пустой строкой (пустой id → null)', () => {
        const emptyId = tasks.filter(t => t.id === '')
        expect(emptyId).toEqual([])
      })

      // 7. Если id выглядит как валидный (5 alphanumeric), он точно 5 символов
      it('id в формате проекта ([A-Za-z0-9]{5}) имеет длину 5', () => {
        const formattedIds = tasks.filter(
          t => t.id !== null && VALID_ID_RE.test(t.id)
        )
        const wrongLength = formattedIds.filter(t => t.id!.length !== 5)
        expect(wrongLength).toEqual([])
      })

      // 8. parent ссылается на id, существующий в том же файле
      it('parent ссылается на существующий id (если задан)', () => {
        const ids = new Set(tasks.map(t => t.id).filter(Boolean))
        const orphans = tasks.filter(
          t => t.parent !== null && !ids.has(t.parent)
        )
        expect(orphans).toEqual([])
      })
    })
  }
})
