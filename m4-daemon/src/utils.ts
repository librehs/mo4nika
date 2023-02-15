export function parseChatId(id: string | number): number | undefined {
  if (typeof id === 'string') {
    if (id === '') return undefined
    id = Number(id)
    if (Number.isNaN(id)) return undefined
  }
  return id
}
