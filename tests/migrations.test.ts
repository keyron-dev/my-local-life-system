import { runMigrations, MIGRATIONS } from '../src/database/migrations'
import { DB } from '../src/database/db'

function makeDb(schemaVersionValue: string | null = null) {
  const execAsync = jest.fn().mockResolvedValue(undefined)
  const runAsync = jest.fn().mockResolvedValue(undefined)
  const getFirstAsync = jest.fn().mockResolvedValue(
    schemaVersionValue !== null ? { value: schemaVersionValue } : null,
  )
  return { execAsync, runAsync, getFirstAsync } as unknown as DB
}

describe('runMigrations', () => {
  it('применяет миграцию версии 1 на пустой базе', async () => {
    const db = makeDb(null)
    await runMigrations(db)

    const migration1 = MIGRATIONS.find(m => m.version === 1)!
    const execCalls = (db.execAsync as jest.Mock).mock.calls.map((c: unknown[]) => c[0])

    for (const sql of migration1.up) {
      expect(execCalls).toContain(sql)
    }
  })

  it('возвращает финальную версию схемы', async () => {
    const db = makeDb(null)
    const version = await runMigrations(db)
    expect(version).toBe(4)
  })

  it('не применяет уже применённую миграцию повторно', async () => {
    const migration1 = MIGRATIONS.find(m => m.version === 1)!
    const firstSqlOfMigration1 = migration1.up[0]

    const db = makeDb('1')
    await runMigrations(db)

    const execCalls = (db.execAsync as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    const migrationSqlCalls = execCalls.filter((sql: string) => sql === firstSqlOfMigration1)
    expect(migrationSqlCalls).toHaveLength(0)
  })

  it('возвращает текущую версию если миграций нет', async () => {
    const db = makeDb('4')
    const version = await runMigrations(db)
    expect(version).toBe(4)
  })

  it('финальная версия схемы равна 4 после всех миграций', async () => {
    const db = makeDb(null)
    const version = await runMigrations(db)
    expect(version).toBe(4)
  })
})
