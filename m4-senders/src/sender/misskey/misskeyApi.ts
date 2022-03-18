import got from 'got'
import FormData from 'form-data'
import type { Got } from 'got'

type GetMe = {
  id: string
  name: string | null
  username: string
}

type NoteVisibility = 'public' | 'home' | 'followers'

export type CreateNoteRequest = {
  visibility: NoteVisibility
  text: string
  cw?: string
  // it's actually nullable (and should be undefined on cases with no files)
  fileIds?: string[]
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
  }
}

type File = {
  id: string
  createdAt: string
  name: string
  type: string
  isSensitive: boolean
  blurhash: string
  comment: string
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

  createFile(filename: string, file: Buffer, contentType: string) {
    const fd = new FormData()
    fd.append('name', filename)
    fd.append('force', 'true')
    fd.append('file', file, {
      filename,
      knownLength: file.length,
    })
    fd.append('i', this.#auth.i)
    return this.#api
      .post('drive/files/create', {
        body: fd,
      })
      .then((x) => x.body) as Promise<File>
  }

  editFileComment(fileId: string, comment: string) {
    return this.#api
      .post('drive/files/update', {
        json: { fileId, comment, ...this.#auth },
      })
      .then((x) => x.body) as Promise<File>
  }
}
