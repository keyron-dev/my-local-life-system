import { parseFile } from '../src/parser/fileParser'
import { Task } from '../src/types/task'

const content = `- [ ] Родитель [t::todo] [id::AAA11]
    - [ ] Дочерняя [t::todo] [id::BBB22]
        - [ ] Внучка [t::todo] [id::CCC33]
    - [ ] Вторая дочерняя [t::todo] [id::DDD44]
- [ ] Второй корень [t::todo] [id::EEE55]
// это комментарий
- [ ] С явным parent [t::todo] [id::FFF66] [parent::EEE55]`

describe('parseFile', () => {
  let tasks: Task[]
  let byId: Record<string, Task>

  beforeEach(() => {
    tasks = parseFile(content)
    byId = Object.fromEntries(tasks.map(t => [t.id, t]))
  })

  it('всего задач: 6 (комментарий не попадает)', () => {
    expect(tasks).toHaveLength(6)
  })

  it('комментарий не попал в массив', () => {
    expect(tasks.every(t => !t.raw.startsWith('//'))).toBe(true)
  })

  it('BBB22.parent === AAA11', () => {
    expect(byId['BBB22'].parent).toBe('AAA11')
  })

  it('CCC33.parent === BBB22', () => {
    expect(byId['CCC33'].parent).toBe('BBB22')
  })

  it('DDD44.parent === AAA11', () => {
    expect(byId['DDD44'].parent).toBe('AAA11')
  })

  it('EEE55.parent === null (корневая задача)', () => {
    expect(byId['EEE55'].parent).toBeNull()
  })

  it('FFF66.parent === EEE55 (явный parent из [parent::])', () => {
    expect(byId['FFF66'].parent).toBe('EEE55')
  })

  it('AAA11.links содержит BBB22', () => {
    expect(byId['AAA11'].links).toContain('BBB22')
  })

  it('AAA11.links содержит DDD44', () => {
    expect(byId['AAA11'].links).toContain('DDD44')
  })

  it('AAA11.links не содержит CCC33 (внучка, не прямой ребёнок)', () => {
    expect(byId['AAA11'].links).not.toContain('CCC33')
  })

  it('BBB22.links содержит CCC33', () => {
    expect(byId['BBB22'].links).toContain('CCC33')
  })
})
