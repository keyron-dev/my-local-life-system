import * as SQLite from 'expo-sqlite'
import { Task } from '../types/task'
import { runMigrations } from './migrations'

export type DB = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>

export async function initDatabase(): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('tasks.db')
  await runMigrations(db)
  return db
}

export async function saveTask(
  db: DB,
  task: Task,
  filePath: string,
  lineNum: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO tasks (
      id, title, status, type, priority, indent_level,
      created, event, start, due, done,
      remind, tags, links, from_tasks,
      parent, repeat, desc, custom_props,
      raw, file_path, line_num, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      title        = excluded.title,
      status       = excluded.status,
      type         = excluded.type,
      priority     = excluded.priority,
      indent_level = excluded.indent_level,
      created      = excluded.created,
      event        = excluded.event,
      start        = excluded.start,
      due          = excluded.due,
      done         = excluded.done,
      remind       = excluded.remind,
      tags         = excluded.tags,
      links        = excluded.links,
      from_tasks   = excluded.from_tasks,
      parent       = excluded.parent,
      repeat       = excluded.repeat,
      desc         = excluded.desc,
      custom_props = excluded.custom_props,
      raw          = excluded.raw,
      file_path    = excluded.file_path,
      line_num     = excluded.line_num,
      updated_at   = excluded.updated_at`,
    [
      task.id,
      task.title,
      task.status,
      task.type,
      task.priority,
      task.indentLevel,
      task.created,
      task.event,
      task.start,
      task.due,
      task.done,
      JSON.stringify(task.remind),
      JSON.stringify(task.tags),
      JSON.stringify(task.links),
      JSON.stringify(task.from),
      task.parent,
      task.repeat,
      task.desc,
      JSON.stringify(task.customProps),
      task.raw,
      filePath,
      lineNum,
      new Date().toISOString(),
    ],
  )
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id:          row.id as string,
    title:       row.title as string,
    status:      row.status as Task['status'],
    type:        row.type as Task['type'],
    priority:    row.priority != null ? Number(row.priority) : null,
    indentLevel: Number(row.indent_level ?? 0),
    created:     (row.created as string | null) ?? null,
    event:       (row.event as string | null) ?? null,
    start:       (row.start as string | null) ?? null,
    due:         (row.due as string | null) ?? null,
    done:        (row.done as string | null) ?? null,
    remind:      JSON.parse((row.remind as string) ?? '[]'),
    tags:        JSON.parse((row.tags as string) ?? '[]'),
    attach:      [],
    links:       JSON.parse((row.links as string) ?? '[]'),
    from:        JSON.parse((row.from_tasks as string) ?? '[]'),
    parent:      (row.parent as string | null) ?? null,
    repeat:      (row.repeat as string | null) ?? null,
    desc:        (row.desc as string | null) ?? null,
    customProps: JSON.parse((row.custom_props as string) ?? '{}'),
    raw:         row.raw as string,
  }
}

export async function getTaskById(db: DB, id: string): Promise<Task | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE id = ?`,
    [id],
  )
  return row ? rowToTask(row) : null
}

export type TaskFilters = {
  type?:      Task['type'][]
  status?:    Task['status'][]
  priority?:  number[]
  dueBefore?: string
  tags?:      string[]
}

export async function getAllTasks(db: DB, filters?: TaskFilters): Promise<Task[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.type?.length) {
    conditions.push(`type IN (${filters.type.map(() => '?').join(', ')})`)
    params.push(...filters.type)
  }

  if (filters?.status?.length) {
    conditions.push(`status IN (${filters.status.map(() => '?').join(', ')})`)
    params.push(...filters.status)
  }

  if (filters?.priority?.length) {
    conditions.push(`priority IN (${filters.priority.map(() => '?').join(', ')})`)
    params.push(...filters.priority)
  }

  if (filters?.dueBefore) {
    conditions.push(`due < ?`)
    params.push(filters.dueBefore)
  }

  if (filters?.tags?.length) {
    // Each tag must appear in the JSON array — one EXISTS subquery per tag
    for (const tag of filters.tags) {
      conditions.push(
        `EXISTS (SELECT 1 FROM json_each(tasks.tags) WHERE value = ?)`,
      )
      params.push(tag)
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `SELECT * FROM tasks ${where}`.trim()

  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params)
  return rows.map(rowToTask)
}

export async function getTasksByType(
  db: DB,
  type: Task['type'],
): Promise<Task[]> {
  return getAllTasks(db, { type: [type] })
}

export async function getOverdueTasks(db: DB, today: string): Promise<Task[]> {
  return getAllTasks(db, { status: ['active'], dueBefore: today })
}
