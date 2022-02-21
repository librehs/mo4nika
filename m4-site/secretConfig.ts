type SecretConfig = {
  db: 'mongodb'
  url: string
}

const Secret: SecretConfig = {
  db: 'mongodb',
  url: process.env.M4_SECRET_DB ?? '',
}

export default Secret
