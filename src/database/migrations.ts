import { DB } from './db'
import {
  CREATE_TASKS_TABLE,
  CREATE_FILTERS_TABLE,
  CREATE_CUSTOM_PROPS_TABLE,
  CREATE_CONFIG_TABLE,
  CREATE_INDEXES,
} from './schema'

type Migration = {
  version: number
  description: string
  up: string[]
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Начальная схема: tasks, filters, custom_properties, config + индексы',
    up: [
      CREATE_TASKS_TABLE,
      CREATE_FILTERS_TABLE,
      CREATE_CUSTOM_PROPS_TABLE,
      CREATE_CONFIG_TABLE,
      ...CREATE_INDEXES,
    ],
  },
  {
    version: 2,
    description: 'Таблица аналитики использования фич',
    up: [
      `CREATE TABLE IF NOT EXISTS analytics_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type  TEXT NOT NULL,
      feature     TEXT NOT NULL,
      metadata    TEXT DEFAULT '{}',
      created_at  TEXT NOT NULL
    )`,
      `CREATE INDEX IF NOT EXISTS idx_analytics_feature
     ON analytics_events(feature)`,
      `CREATE INDEX IF NOT EXISTS idx_analytics_type
     ON analytics_events(event_type)`,
    ],
  },
  {
    version: 3,
    description: 'Таблица вложений',
    up: [
      `CREATE TABLE IF NOT EXISTS attachments (
      id          TEXT PRIMARY KEY,
      task_id     TEXT NOT NULL,
      file_path   TEXT NOT NULL,
      file_name   TEXT NOT NULL,
      file_type   TEXT,
      created_at  TEXT NOT NULL
    )`,
      `CREATE INDEX IF NOT EXISTS idx_attachments_task
     ON attachments(task_id)`,
    ],
  },
]

export async function runMigrations(db: DB): Promise<number> {
  await db.execAsync(CREATE_CONFIG_TABLE)

  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM config WHERE key = ?`,
    ['schema_version'],
  )
  let currentVersion = row ? Number(row.value) : 0

  const pending = MIGRATIONS
    .filter(m => m.version > currentVersion)
    .sort((a, b) => a.version - b.version)

  for (const migration of pending) {
    for (const sql of migration.up) {
      await db.execAsync(sql)
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`,
      ['schema_version', String(migration.version)],
    )
    currentVersion = migration.version
  }

  return currentVersion
}
