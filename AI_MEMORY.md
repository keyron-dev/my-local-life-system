# Память ИИ — My-Local-Life-System

> Этот файл существует потому что Claude регулярно крашится и переустанавливается.
> Когда начинаешь новую сессию — **скинь этот файл в чат первым сообщением**.
> Ты (Claude) продолжаешь работу, не начинаешь заново.

---

## Что за проект

Локальный таск-менеджер на React Native (Expo) для Android.
Работает через **Termux на телефоне разработчика**.
Управляется голосом/текстом — разработчик **не пишет код сам**, только даёт задачи AI.

GitHub: `git@github.com:keyron-dev/my-local-life-system.git`
Ветка: `master`
Рабочая директория: `/data/data/com.termux/files/home/My-Local-Life-System`

---

## Фундаментальная архитектура

```
[Приложение] ↔ [MD файлы] ↔ [Obsidian]
                    ↕
              [SQLite кэш]
```

**Главное правило:** MD файлы — единственный источник истины. SQLite — только кэш для скорости.
Запись всегда идёт сначала в MD, потом обновляется SQLite. Никогда наоборот.

---

## Файловая структура задач (на устройстве)

9 файлов в `/storage/emulated/0/MyTasks/tasks/`:
`inbox.md`, `backlog.md`, `calendar.md`, `projects.md`, `ideas.md`, `notes.md`, `delegated.md`, `someday.md`, `done.md`

---

## Формат задачи (одна строка MD)

```
- [СТАТУС] Название [t::ТИП] [id::ID] [свойства...] ^[описание<br>с переносами]
```

Пример:
```
- [ ] Запустить сайт [t::todo] [id::aB3cD] [due::2025-03-01] [tags::работа,важное] ^[Первый шаг<br>Второй шаг]
```

### Статусы (символ в `[ ]`)

| Символ | Значение |
|--------|----------|
| ` ` | active |
| `x` или `X` | done |
| `-` | cancelled |
| `/` | in_progress |

### Типы (`[t::]`) → файл

| Тип | Файл |
|-----|------|
| нет `[t::]` | inbox.md |
| todo | backlog.md |
| cal | calendar.md |
| Pj | projects.md |
| id | ideas.md |
| nt | notes.md |
| dg | delegated.md |
| sdl | someday.md |

### Встроенные свойства

`id` (5 символов), `created`, `event`, `start`, `due`, `done`, `remind` (список), `tags` (список), `priority` (0-3), `parent` (один id), `links` (список id), `from` (список id, вычисляемый), `repeat` (формула повторения)

Всё остальное `[key::value]` — кастомное свойство пользователя.

### Особый синтаксис

- Описание: `^[текст<br>перенос]` — инлайн footnote Obsidian, **не** обычное `[key::value]`
- Комментарии: строка начинается с `//` — парсер её игнорирует
- Вложенность: отступ 4 пробела = уровень вложенности → parent/links (если не указаны явно)

---

## Технологический стек

React Native + Expo, TypeScript, expo-sqlite, expo-file-system.
Тесты через Jest (jest-expo preset).
`expo-sqlite` замокан в `__mocks__/expo-sqlite.ts` для тестов.

---

## Структура кода

```
src/
  types/task.ts          — интерфейс Task
  parser/
    parser.ts            — parseLine: MD строка → Task
    fileParser.ts        — parseFile: весь файл → Task[]
    serializer.ts        — serializeTask: Task → MD строка
  database/
    schema.ts            — SQL CREATE TABLE строки
    db.ts                — initDatabase, saveTask, getTaskById, getAllTasks, getOverdueTasks
    migrations.ts        — runMigrations, MIGRATIONS (система версионирования схемы)
  sync/
    fileWriter.ts        — findTaskLineById, updateTaskInFile, appendTaskToFile
    sync.ts              — indexFile, syncTaskToFile, markTaskDone, getFileForType
    watcher.ts           — hashContent, hasFileChanged, processFileIfChanged
    attachments.ts       — getAttachmentsPath, ensureAttachmentsDir, saveAttachment,
                           getTaskAttachments, deleteAttachment
  core/
    taskActions.ts       — createTask, changeTaskType, completeTask, cancelTask,
                           linkTasks, unlinkTasks, deleteTask, getLinkedTasks,
                           updateTaskProperties
    config.ts            — getConfig, setConfig, getTaskFilePath, isFeatureEnabled
    customProperties.ts  — createCustomProperty, getCustomProperties,
                           archiveCustomProperty, deleteCustomProperty
    filters.ts           — saveFilter, getFilters, deleteFilter
  ui/
    Navigation.tsx       — NavigationContainer + BottomTab (Home/Inbox/Lists) + NativeStack
    screens/
      HomeScreen.tsx, InboxScreen.tsx, BacklogScreen.tsx, ProjectsScreen.tsx,
      IdeasScreen.tsx, NotesScreen.tsx, SomedayScreen.tsx, DelegatedScreen.tsx,
      DoneScreen.tsx     — заглушки, пока рендерят только название экрана
tests/                   — зеркалит структуру src
test-files/              — 9 MD файлов с тестовыми задачами и edge cases
```

---

## Текущий статус (после сессии 2026-06-25)

### Фаза 1 — ЗАКРЫТА полностью ✅

- ✅ Парсер строки и файла, со всеми edge cases
- ✅ Сериализация Task → MD строка
- ✅ SQLite схема, индексы, CRUD
- ✅ Фильтрация и поиск задач
- ✅ Синхронизация MD ↔ SQLite (двусторонняя)
- ✅ File watcher с hash-проверкой
- ✅ CRUD операции (создание, смена типа, выполнение, отмена, связи, удаление, unlink)
- ✅ Настройки и конфиг (`src/core/config.ts`)
- ✅ Кастомные свойства (`src/core/customProperties.ts`)
- ✅ Сохранённые фильтры (`src/core/filters.ts`)
- ✅ Система миграций схемы (`src/database/migrations.ts`) — текущая версия схемы: **3**
- ✅ Аналитика (`analytics_events` — migration v2)
- ✅ Вложения — `attach` в Task + `src/sync/attachments.ts` (migration v3)
- ✅ `ParsedEvent` тип + `parsedEvent` computed поле в Task (парсинг свойства `event`)
  - `parseEvent(raw)` экспортируется из `src/parser/parser.ts`
  - Форматы: дата, дата+время, интервал, короткая запись `T10:00/18:00`, многодневный
  - `parsedEvent` не сериализуется — вычисляется при парсинге, сырое `event` остаётся

### Фаза 2 — В процессе 🔧

- ✅ React Navigation установлен: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`
  - **Важно:** использован `@react-navigation/native-stack` (НЕ `@react-navigation/stack`) — не требует gesture-handler
- ✅ 9 экранов-заглушек в `src/ui/screens/`: Home, Inbox, Backlog, Projects, Ideas, Notes, Someday, Delegated, Done
- ✅ `src/ui/Navigation.tsx` — BottomTab (Home | Inbox | Lists) + NativeStack внутри Lists
- ✅ `App.tsx` рендерит `<Navigation />`

**Тестов: 324, все зелёные.** Запуск: `npm test`

### Последний коммит в репо

`e0479c3` — feat: add migrations, attachments, UI navigation structure (316 tests)

> Незакоммиченные изменения: `parseEvent` + `ParsedEvent` (будет закоммичено).

---

## Правила работы (обязательно соблюдать)

1. **Не переписывай существующие файлы с нуля — дополняй.**
2. Каждое изменение сопровождается тестами.
3. Не мутируй объекты Task — всегда возвращай новые копии.
4. JSON поля (`tags`, `links`, `remind`, `customProps`) сериализуются в SQLite как строки.
5. `from` называется `from_tasks` в SQLite (зарезервированное слово).
6. **Никогда не помечай задачи как выполненные в чеклистах без явного запроса.** Если не уверен что что-то готово — проверяй через grep.
7. После каждого изменения — `npm test`. Все тесты должны оставаться зелёными.
8. Expo: читай документацию на `https://docs.expo.dev/versions/v56.0.0/` перед написанием кода.

---

## Как работает разработчик

- Не пишет код сам.
- Даёт задачи через Claude Code пошагово, малыми итерациями.
- После каждого шага — `npm test`, результат проверяется.
- Коммитит и пушит по запросу разработчика (сам не коммитит без просьбы).
- Нужны короткие ответы, без лишних объяснений.

---

## Моки

### expo-sqlite (`__mocks__/expo-sqlite.ts`)

```typescript
export const openDatabaseAsync = jest.fn().mockResolvedValue({
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
})
```

Важно: в тестах `db.test.ts` после `initDatabase()` нужно делать `(db.runAsync as jest.Mock).mockClear()` — потому что `runMigrations` внутри `initDatabase` сам вызывает `runAsync` для записи `schema_version`.

### expo-file-system (`__mocks__/expo-file-system.ts`)

```typescript
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: true })
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined)
export const copyAsync = jest.fn().mockResolvedValue(undefined)
export const deleteAsync = jest.fn().mockResolvedValue(undefined)
```

---

## Что делать в начале следующей сессии

1. `cd /data/data/com.termux/files/home/My-Local-Life-System`
2. `git status` — проверить нет ли незакоммиченных изменений
3. `npm test` — убедиться что всё зелёное
4. Спросить разработчика что делаем дальше
