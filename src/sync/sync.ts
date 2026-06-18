import { parseFile } from '../parser/fileParser'
import { serializeTask } from '../parser/serializer'
import { saveTask, getAllTasks } from '../database/db'
import { findTaskLineById, updateTaskInFile, appendTaskToFile } from './fileWriter'
import { Task } from '../types/task'
import { DB } from '../database/db'

export async function indexFile(
  db: DB,
  filePath: string,
  content: string,
): Promise<void> {
  const tasks = parseFile(content)
  const lines = content.split('\n')

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    // Find the task whose raw line matches this line
    const task = tasks.find(t => t.raw === lines[lineNum])
    if (task) {
      await saveTask(db, task, filePath, lineNum)
    }
  }
}

export function syncTaskToFile(
  db: DB,
  task: Task,
  content: string,
): string {
  if (!task.id) {
    return appendTaskToFile(content, serializeTask(task))
  }

  const lineNum = findTaskLineById(content, task.id)
  const newLine = serializeTask(task)

  if (lineNum !== -1) {
    return updateTaskInFile(content, task.id, newLine)
  } else {
    return appendTaskToFile(content, newLine)
  }
}

export function markTaskDone(task: Task): Task {
  return {
    ...task,
    status: 'done',
    done: new Date().toISOString(),
  }
}

export function getFileForType(type: Task['type']): string {
  switch (type) {
    case 'inbox': return 'inbox.md'
    case 'todo':  return 'backlog.md'
    case 'cal':   return 'calendar.md'
    case 'Pj':    return 'projects.md'
    case 'id':    return 'ideas.md'
    case 'nt':    return 'notes.md'
    case 'dg':    return 'delegated.md'
    case 'sdl':   return 'someday.md'
    default:      return 'inbox.md'
  }
}
