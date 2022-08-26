import fs from 'fs'

export const writeFile = (path, text) => {
  return fs.promises.writeFile(path, text)
}
