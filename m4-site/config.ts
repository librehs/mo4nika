type Config = {
  name: string
}

const Global: Config = {
  name: process.env.NEXT_PUBLIC_M4_SITE_NAME ?? 'Mo4nika',
}

export default Global
