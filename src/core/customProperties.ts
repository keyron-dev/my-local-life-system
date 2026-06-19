import { DB } from '../database/db'

export type CustomProperty = {
  key: string
  displayName: string
  type: 'text' | 'number' | 'date' | 'list' | 'flag'
}

export async function createCustomProperty(
  db: DB,
  prop: CustomProperty,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO custom_properties (key, display_name, type) VALUES (?, ?, ?)`,
    [prop.key, prop.displayName, prop.type],
  )
}

export async function getCustomProperties(db: DB): Promise<CustomProperty[]> {
  const rows = await db.getAllAsync<{ key: string; display_name: string; type: string }>(
    `SELECT key, display_name, type FROM custom_properties`,
    [],
  )
  return rows.map(row => ({
    key: row.key,
    displayName: row.display_name,
    type: row.type as CustomProperty['type'],
  }))
}

export async function archiveCustomProperty(db: DB, key: string): Promise<void> {
  const row = await db.getFirstAsync<{ display_name: string }>(
    `SELECT display_name FROM custom_properties WHERE key = ?`,
    [key],
  )
  if (!row) return
  if (row.display_name.startsWith('[archived] ')) return
  await db.runAsync(
    `UPDATE custom_properties SET display_name = ? WHERE key = ?`,
    [`[archived] ${row.display_name}`, key],
  )
}

export async function deleteCustomProperty(db: DB, key: string): Promise<void> {
  await db.runAsync(`DELETE FROM custom_properties WHERE key = ?`, [key])
}
