export interface Message {
  value: string
}

export function createMessage(value: string): Message {
  return { value }
}
