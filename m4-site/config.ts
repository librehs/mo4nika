type Config = {
  name: string
  misskeyDomain?: string
}

const Global: Config = {
  name: process.env.NEXT_PUBLIC_USERNAME ?? 'Mo4nika',
  misskeyDomain: process.env.NEXT_PUBLIC_MISSKEY_DOMAIN,
}

export default Global
