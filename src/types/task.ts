export type ParsedEvent = {
  start: string
  end: string | null
  isAllDay: boolean
}

export interface Task {
  title: string
  status: 'active' | 'done' | 'cancelled' | 'in_progress'
  type: 'inbox' | 'todo' | 'cal' | 'Pj' | 'id' | 'nt' | 'dg' | 'sdl'
  id: string | null
  created: string | null
  event: string | null
  start: string | null
  due: string | null
  done: string | null
  remind: string[]
  tags: string[]
  attach: string[]
  priority: number | null
  indentLevel: number
  parent: string | null
  links: string[]
  from: string[]
  repeat: string | null
  desc: string | null
  raw: string
  dgWho: string | null
  dgWhen: string | null
  customProps: Record<string, string>
  parsedEvent: ParsedEvent | null
}
