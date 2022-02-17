import got from 'got'
import type { Got } from 'got'

type GetMe = {
  id: string
  name: string | null
  username: string
}

type NoteVisibility = 'public' | 'home' | 'followers'

type CreateNoteRequest = {
  visibility: NoteVisibility
  text: string
  cw?: string
  fileIds: string[]
  replyId?: string
  renoteId?: string
}

type CreateNoteResponse = {
  createdNote: {
    id: string
    createdAt: string
    text: string
    cw?: string
    replyId?: string
    renoteId?: string
    visibility: NoteVisibility
    mentions?: string[]
    fileIds?: []
    tags?: []
    channelId?: string
    uri?: string
    url?: string
  }
}

export default class MisskeyApi {
  #api: Got
  #auth: { i: string }

  constructor(domain: string, token: string) {
    this.#api = got.extend({
      prefixUrl: `https://${domain}/api/`,

      responseType: 'json',
    })
    this.#auth = { i: token }
  }

  getMe() {
    return this.#api
      .post('i', {
        json: { ...this.#auth },
      })
      .then((x) => x.body) as Promise<GetMe>
  }

  createNote(c: CreateNoteRequest) {
    return this.#api
      .post('notes/create', {
        json: { ...c, ...this.#auth },
      })
      .then((x) => x.body) as Promise<CreateNoteResponse>
  }

  createFile(filename: string, file: ReadableStream) {
    throw Error('Not implemented')
  }
}
