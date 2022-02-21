export function toNumber(num: string | string[], def: number): number {
  if (!Number.isNaN(Number(num))) {
    return Number(num)
  }
  return def
}

export type WithOk<V> =
  | {
      ok: true
      data: V
    }
  | {
      ok: false
      reason: string
    }
