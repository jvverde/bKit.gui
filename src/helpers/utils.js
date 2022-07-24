export const formatBytes = (bytes, decimal = 2) => {
  const KB = 1024
  const MB = KB * KB
  const GB = KB * MB
  const TB = KB * GB

  if (bytes < KB) return bytes + ' Bytes'
  else if (bytes < MB) return (bytes / KB).toFixed(decimal) + ' KB'
  else if (bytes < GB) return (bytes / MB).toFixed(decimal) + ' MB'
  else if (bytes < TB) return (bytes / GB).toFixed(decimal) + ' GB'
  else return (bytes / TB).toFixed(decimal) + ' TB'
}

export function deepFreeze (object) {
  // Retrieve the property names defined on object
  var propNames = Object.getOwnPropertyNames(object)

  // Freeze properties before freezing self

  for (let name of propNames) {
    let value = object[name]

    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }

  return Object.freeze(object)
}
