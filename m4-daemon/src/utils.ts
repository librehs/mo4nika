export function parseChatId(id: string | number): number | undefined {
  if (typeof id === 'string') {
    if (id === '') return undefined
    id = Number(id)
    if (Number.isNaN(id)) return undefined
  }
  if (id < 0) {
    if (String(id).startsWith('-100')) {
      id = Number(String(id).replace(/^-100/, ''))
    } else {
      return undefined
    }
  }
  return id
}
