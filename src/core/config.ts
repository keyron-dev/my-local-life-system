import { DB } from '../database/db'

export type AppConfig = {
  vaultPath: string
  userLevel: 'simple' | 'advanced' | 'gtd'
  enabledFeatures: string[]
  taskFilesDir: string
}

const DEFAULTS: AppConfig = {
  vaultPath: '/storage/emulated/0/MyTasks',
  userLevel: 'simple',
  enabledFeatures: [],
  taskFilesDir: '/storage/emulated/0/MyTasks/tasks',
}

export async function getConfig(db: DB): Promise<AppConfig> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM config`,
    [],
  )

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }

  return {
    vaultPath: map.vaultPath ?? DEFAULTS.vaultPath,
    userLevel: (map.userLevel as AppConfig['userLevel']) ?? DEFAULTS.userLevel,
    enabledFeatures: map.enabledFeatures
      ? JSON.parse(map.enabledFeatures)
      : DEFAULTS.enabledFeatures,
    taskFilesDir: map.taskFilesDir ?? DEFAULTS.taskFilesDir,
  }
}

export async function setConfig(
  db: DB,
  key: keyof AppConfig,
  value: unknown,
): Promise<void> {
  const serialized =
    Array.isArray(value) || (typeof value === 'object' && value !== null)
      ? JSON.stringify(value)
      : String(value)

  await db.runAsync(
    `INSERT INTO config (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, serialized],
  )
}

export async function getTaskFilePath(
  db: DB,
  fileName: string,
): Promise<string> {
  const config = await getConfig(db)
  return `${config.taskFilesDir}/${fileName}`
}

export async function isFeatureEnabled(
  db: DB,
  feature: string,
): Promise<boolean> {
  const config = await getConfig(db)
  return config.enabledFeatures.includes(feature)
}
