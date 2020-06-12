import Shell from 'node-powershell'
import say from './say'

const runas = async () => {
  const args = process.argv.concat(['--elevated'])
  const cmd = args.shift()
  const escaped = args.map(e => {
   return e.startsWith('-') && !e.match(/^["']/) ? e : `"${e}"` 
  }).join(' ')
  console.log('escaped', escaped)
  const ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
  })
  ps.addCommand(`Start-Process -WindowStyle hidden "${cmd}" -Verb RunAs -Wait -ArgumentList '${escaped}'`)
  say.log('invoke RunAs')
  await ps.invoke()
    .then(output => {
      say.log('Output:', output)
    })
    .catch(err => {
      say.log('Err:', err)
      throw err
    })
  say.log('RunAs done')
} 

export default async function () {
  say.log('Run as Administrator')
  await runas()
  say.log('Continue run as normal user')
}
