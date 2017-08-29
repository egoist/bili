import fancyLog from 'fancy-log'

export default function(type, msg, color) {
  if (!color) {
    fancyLog(`${type} ${msg}`)
    return
  }
  fancyLog(`${color(type)} ${msg}`)
}
