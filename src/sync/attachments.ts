import * as FileSystem from 'expo-file-system'
import { DB } from '../database/db'

const ATTACHMENTS_DIR = 'attachments'

export function getAttachmentsPath(vaultPath: string): string {
  return `${vaultPath}/${ATTACHMENTS_DIR}`
}

export async function ensureAttachmentsDir(vaultPath: string): Promise<void> {
  const dir = getAttachmentsPath(vaultPath)
  const info = await FileSystem.getInfoAsync(dir)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }
}

export async function saveAttachment(
  db: DB,
  taskId: string,
  sourceUri: string,
  vaultPath: string,
): Promise<string> {
  await ensureAttachmentsDir(vaultPath)

  const attachId = Math.random().toString(36).substring(2, 7).toUpperCase()
  const ext = sourceUri.split('.').pop() ?? 'bin'
  const fileName = `${taskId}_${attachId}.${ext}`
  const destPath = `${getAttachmentsPath(vaultPath)}/${fileName}`

  await FileSystem.copyAsync({ from: sourceUri, to: destPath })

  await db.runAsync(
    `INSERT INTO attachments (id, task_id, file_path, file_name, file_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      attachId,
      taskId,
      destPath,
      fileName,
      ext,
      new Date().toISOString(),
    ],
  )

  return attachId
}

export async function getTaskAttachments(
  db: DB,
  taskId: string,
): Promise<{ id: string; filePath: string; fileName: string; fileType: string }[]> {
  const rows = await db.getAllAsync<{
    id: string
    file_path: string
    file_name: string
    file_type: string
  }>(
    `SELECT id, file_path, file_name, file_type FROM attachments WHERE task_id = ?`,
    [taskId],
  )
  return rows.map(r => ({
    id: r.id,
    filePath: r.file_path,
    fileName: r.file_name,
    fileType: r.file_type,
  }))
}

export async function deleteAttachment(
  db: DB,
  attachId: string,
): Promise<void> {
  const row = await db.getFirstAsync<{ file_path: string }>(
    `SELECT file_path FROM attachments WHERE id = ?`,
    [attachId],
  )
  if (row) {
    await FileSystem.deleteAsync(row.file_path, { idempotent: true })
  }
  await db.runAsync(`DELETE FROM attachments WHERE id = ?`, [attachId])
}
