const crypto = require('crypto')

const defaultAlgo = 'aes-256-cbc'

export const encrypt = (text, password, algorithm = defaultAlgo) => {
  const salt = crypto.randomBytes(8) // Don't change for compatibility with openssl pkdf2
  // const key = crypto.scryptSync(password, salt, 32)
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = cipher.update(text, 'utf8', 'base64')
  return [
    iv.toString('base64'),
    salt.toString('base64'),
    encrypted + cipher.final('base64')
  ].join('|')
}

export const decrypt = (text, password, algorithm = defaultAlgo) => {
  const [iv, salt, encrypted] = text.split('|').map(e => Buffer.from(e, 'base64'))
  // const key = crypto.scryptSync(password, salt, 32)
  // const key = scrypt(password, salt, 32)
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  const decrypted = decipher.update(encrypted)
  return Buffer
    .concat([decrypted, decipher.final()])
    .toString()
}

export const hmac = (text, key) => crypto.createHmac('sha256', key).update(text.toString()).digest('base64')
export const hash = msg => crypto.createHash('sha512').update(msg).digest('hex')
