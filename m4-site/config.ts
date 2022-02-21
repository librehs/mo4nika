type Config = {
  name: string
}

const Global: Config = {
  name: process.env.NEXT_PUBLIC_USERNAME ?? 'Mo4nika',
}

export default Global
