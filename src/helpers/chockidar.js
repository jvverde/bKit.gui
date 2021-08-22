export const chokidar = require('chokidar')
export const chokidarOptions = {
  depth: 0,
  useFsEvents: false,
  ignoreInitial: true,
  followSymlinks: false,
  ignored: ['.before-restore-on*', 'pagefile.sys'],
  atomic: true,
  ignorePermissionErrors: true,
  persistent: true
}
