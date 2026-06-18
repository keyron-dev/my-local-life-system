import {
  findTaskLineById,
  updateTaskInFile,
  appendTaskToFile,
} from '../src/sync/fileWriter'

const SAMPLE_CONTENT = [
  '- [ ] Первая задача [t::todo] [id::AAA11]',
  '- [ ] Вторая задача [t::todo] [id::BBB22]',
  '    - [ ] Дочерняя [t::todo] [id::CCC33]',
  '- [x] Выполненная [t::todo] [id::DDD44] [done::2025-06-01]',
  '// комментарий',
  '- [ ] Последняя [t::todo] [id::EEE55]',
].join('\n')

describe('findTaskLineById', () => {
  it('находит первую строку (line 0)', () => {
    expect(findTaskLineById(SAMPLE_CONTENT, 'AAA11')).toBe(0)
  })

  it('находит строку в середине файла', () => {
    expect(findTaskLineById(SAMPLE_CONTENT, 'BBB22')).toBe(1)
  })

  it('находит вложенную задачу', () => {
    expect(findTaskLineById(SAMPLE_CONTENT, 'CCC33')).toBe(2)
  })

  it('находит последнюю строку', () => {
    expect(findTaskLineById(SAMPLE_CONTENT, 'EEE55')).toBe(5)
  })

  it('возвращает -1 если ID не существует', () => {
    expect(findTaskLineById(SAMPLE_CONTENT, 'ZZZ99')).toBe(-1)
  })

  it('возвращает -1 для пустого файла', () => {
    expect(findTaskLineById('', 'AAA11')).toBe(-1)
  })

  it('не путает частичное совпадение (AAA1 не находит AAA11)', () => {
    // [id::AAA1] не совпадает с [id::AAA11] — ищем точный токен с ]
    expect(findTaskLineById(SAMPLE_CONTENT, 'AAA1')).toBe(-1)
  })
})

describe('updateTaskInFile', () => {
  it('заменяет строку с нужным ID', () => {
    const newLine = '- [x] Первая задача [t::todo] [id::AAA11] [done::2025-06-18]'
    const result = updateTaskInFile(SAMPLE_CONTENT, 'AAA11', newLine)
    const lines = result.split('\n')
    expect(lines[0]).toBe(newLine)
  })

  it('не трогает остальные строки', () => {
    const newLine = '- [x] Первая задача [t::todo] [id::AAA11] [done::2025-06-18]'
    const result = updateTaskInFile(SAMPLE_CONTENT, 'AAA11', newLine)
    const lines = result.split('\n')
    expect(lines[1]).toBe('- [ ] Вторая задача [t::todo] [id::BBB22]')
    expect(lines[5]).toBe('- [ ] Последняя [t::todo] [id::EEE55]')
  })

  it('заменяет строку в середине файла', () => {
    const newLine = '- [-] Отменённая [t::todo] [id::BBB22]'
    const result = updateTaskInFile(SAMPLE_CONTENT, 'BBB22', newLine)
    expect(result.split('\n')[1]).toBe(newLine)
  })

  it('возвращает исходный текст если ID не найден', () => {
    const result = updateTaskInFile(SAMPLE_CONTENT, 'ZZZ99', '- [ ] Новая')
    expect(result).toBe(SAMPLE_CONTENT)
  })

  it('количество строк не изменяется после замены', () => {
    const before = SAMPLE_CONTENT.split('\n').length
    const result = updateTaskInFile(SAMPLE_CONTENT, 'CCC33', '        - [x] Дочерняя [t::todo] [id::CCC33]')
    expect(result.split('\n').length).toBe(before)
  })
})

describe('appendTaskToFile', () => {
  it('добавляет строку в конец файла с переносом', () => {
    const newLine = '- [ ] Новая задача [t::todo] [id::FFF66]'
    const result = appendTaskToFile(SAMPLE_CONTENT, newLine)
    const lines = result.split('\n')
    expect(lines[lines.length - 1]).toBe(newLine)
  })

  it('не добавляет лишний перенос если файл уже заканчивается на \\n', () => {
    const contentWithNewline = SAMPLE_CONTENT + '\n'
    const newLine = '- [ ] Новая [id::FFF66]'
    const result = appendTaskToFile(contentWithNewline, newLine)
    // должно быть ровно одна пустая строка между последней задачей и новой
    expect(result).toBe(contentWithNewline + newLine)
  })

  it('добавляет \\n перед строкой если файл не заканчивается на \\n', () => {
    const newLine = '- [ ] Новая [id::FFF66]'
    const result = appendTaskToFile(SAMPLE_CONTENT, newLine)
    expect(result).toBe(SAMPLE_CONTENT + '\n' + newLine)
  })

  it('работает с пустым файлом', () => {
    const newLine = '- [ ] Первая задача [id::AAA11]'
    expect(appendTaskToFile('', newLine)).toBe(newLine)
  })

  it('сохраняет весь исходный контент без изменений', () => {
    const newLine = '- [ ] Добавленная [id::XYZ99]'
    const result = appendTaskToFile(SAMPLE_CONTENT, newLine)
    expect(result.startsWith(SAMPLE_CONTENT)).toBe(true)
  })
})
