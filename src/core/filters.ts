import { DB } from '../database/db'

export type SavedFilter = {
  id: string
  name: string
  conditions: {
    type?: string[]
    status?: string[]
    priority?: number[]
    tags?: string[]
    properties?: Record<string, string>
  }
}

export async function saveFilter(db: DB, filter: SavedFilter): Promise<void> {
  await db.runAsync(
    `INSERT INTO filters (id, name, conditions, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, conditions = excluded.conditions`,
    [filter.id, filter.name, JSON.stringify(filter.conditions), new Date().toISOString()],
  )
}

export async function getFilters(db: DB): Promise<SavedFilter[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; conditions: string }>(
    `SELECT id, name, conditions FROM filters`,
    [],
  )
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    conditions: JSON.parse(row.conditions),
  }))
}

export async function deleteFilter(db: DB, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM filters WHERE id = ?`, [id])
}
