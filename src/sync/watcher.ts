import { DB } from '../database/db'
import { indexFile } from './sync'

export function hashContent(content: string): string {
  let sum = 0
  for (let i = 0; i < content.length; i++) {
    sum = (sum + content.charCodeAt(i)) >>> 0
  }
  return sum.toString(16)
}

export async function hasFileChanged(db: DB, filePath: string, newHash: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM config WHERE key = ?`,
    [`hash_${filePath}`],
  )
  if (!row) return true
  return row.value !== newHash
}

export async function saveFileHash(db: DB, filePath: string, hash: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`,
    [`hash_${filePath}`, hash],
  )
}

export async function processFileIfChanged(
  db: DB,
  filePath: string,
  content: string,
): Promise<boolean> {
  const hash = hashContent(content)
  const changed = await hasFileChanged(db, filePath, hash)
  if (!changed) return false
  await indexFile(db, filePath, content)
  await saveFileHash(db, filePath, hash)
  return true
}
