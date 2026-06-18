export const CREATE_TASKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    status        TEXT NOT NULL,
    type          TEXT NOT NULL,
    priority      INTEGER,
    indent_level  INTEGER NOT NULL DEFAULT 0,
    created       TEXT,
    event         TEXT,
    start         TEXT,
    due           TEXT,
    done          TEXT,
    remind        TEXT DEFAULT '[]',
    tags          TEXT DEFAULT '[]',
    links         TEXT DEFAULT '[]',
    from_tasks    TEXT DEFAULT '[]',
    parent        TEXT,
    repeat        TEXT,
    desc          TEXT,
    custom_props  TEXT DEFAULT '{}',
    raw           TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    line_num      INTEGER NOT NULL DEFAULT 0,
    updated_at    TEXT
  )
`

export const CREATE_FILTERS_TABLE = `
  CREATE TABLE IF NOT EXISTS filters (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    conditions  TEXT NOT NULL,
    created_at  TEXT
  )
`

export const CREATE_CUSTOM_PROPS_TABLE = `
  CREATE TABLE IF NOT EXISTS custom_properties (
    key           TEXT PRIMARY KEY,
    display_name  TEXT,
    type          TEXT NOT NULL
  )
`

export const CREATE_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS config (
    key    TEXT PRIMARY KEY,
    value  TEXT
  )
`

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_type ON tasks(type)`,
  `CREATE INDEX IF NOT EXISTS idx_status ON tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_due ON tasks(due)`,
  `CREATE INDEX IF NOT EXISTS idx_priority ON tasks(priority)`,
]
