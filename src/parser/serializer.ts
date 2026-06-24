import { Task } from '../types/task'

function statusChar(status: Task['status']): string {
  switch (status) {
    case 'done':        return 'x'
    case 'cancelled':   return '-'
    case 'in_progress': return '/'
    default:            return ' '
  }
}

export function serializeTask(task: Task): string {
  const indent = '    '.repeat(task.indentLevel)

  // Collect all property tokens
  const props: string[] = []

  if (task.type !== 'inbox')                 props.push(`[t::${task.type}]`)
  if (task.id)                               props.push(`[id::${task.id}]`)
  if (task.created)                          props.push(`[created::${task.created}]`)
  if (task.event)                            props.push(`[event::${task.event}]`)
  if (task.start)                            props.push(`[start::${task.start}]`)
  if (task.due)                              props.push(`[due::${task.due}]`)
  if (task.done)                             props.push(`[done::${task.done}]`)
  if (task.remind.length > 0)               props.push(`[remind::${task.remind.join(',')}]`)
  if (task.tags.length > 0)                 props.push(`[tags::${task.tags.join(',')}]`)
  if (task.attach?.length > 0)             props.push(`[attach::${task.attach.join(',')}]`)
  if (task.priority !== null)               props.push(`[priority::${task.priority}]`)
  if (task.parent)                           props.push(`[parent::${task.parent}]`)
  if (task.links.length > 0)                props.push(`[links::${task.links.join(',')}]`)
  if (task.repeat)                           props.push(`[repeat::${task.repeat}]`)

  for (const [key, value] of Object.entries(task.customProps)) {
    if (value !== '') props.push(`[${key}::${value}]`)
  }

  const desc = task.desc ? ` ^[${task.desc}]` : ''

  // Inbox with no properties → plain "- title"
  if (task.type === 'inbox' && props.length === 0 && !task.desc) {
    return `${indent}- ${task.title}`
  }

  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : ''
  return `${indent}- [${statusChar(task.status)}] ${task.title}${propsStr}${desc}`
}
