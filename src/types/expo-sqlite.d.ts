declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(sql: string): Promise<void>
    runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>
    getFirstAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>
    getAllAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>
}
