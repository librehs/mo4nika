import type { MessageEntity } from 'grammy/out/types'

import parseTextEntities from './textEntities'

export function getMfmText(
  text: string,
  entities: MessageEntity[],
  disabledTypes: string[] = []
): string {
  const { md } = parseTextEntities(text, entities, disabledTypes)
  return md
}
