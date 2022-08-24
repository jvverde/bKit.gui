import say from '../utils/say'
import { pki } from 'node-forge'

import rootCA from './ca'
 
export default ({ session, ca = rootCA }) => {
  try {
    // console.log('rootCA', rootCA)
    const caStore = pki.createCaStore(rootCA)
    session.setCertificateVerifyProc(async (request, callback) => {
      // https://www.electronjs.org/docs/api/session
      // console.log('setCertificateVerifyProc', request)
      try {
        const certdata = request.certificate.data
        // console.log('certdata', certdata)
        const cert = pki.certificateFromPem(certdata)
        // console.log('cert', cert)
        if (pki.verifyCertificateChain(caStore, [ cert ])) {
          say.log('Certicate verified!')
          callback(0)
        } else {
          say.error('Failed due to some unknown reason', e.message || e)
          callback(-3)
        }
      } catch (e) {
        say.error('Failed to verify certificate', e.message || e)
        callback(-3)
      }
      return
    })
  } catch (e) {
    say.error('Failed to verify certificate', e.message || e)
  }
}
