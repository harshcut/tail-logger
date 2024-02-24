import fs from 'fs'
import events from 'events'

const INITIAL_READ_LINES = 10
const READ_CHUNK_SIZE = 8
const POLLING_INTERVAL = 1000

export default class TailFile extends events.EventEmitter {
  private queue: string[]
  private filename: string
  private eof: number

  constructor(filename: string) {
    super()
    this.queue = []
    this.filename = filename
    this.eof = -1
  }

  init() {
    const file = fs.openSync(this.filename, 'r')
    this.eof = fs.fstatSync(file).size

    let bufferSize = Math.min(READ_CHUNK_SIZE, this.eof)
    let buffer = Buffer.alloc(bufferSize)
    let stringTail = ''
    let position = this.eof

    while (position > 0) {
      position -= bufferSize
      if (position < 0) {
        bufferSize += position
        buffer = buffer.subarray(0, position)
        position = 0
      }

      fs.readSync(file, buffer, 0, bufferSize, position)
      stringTail = buffer.toString() + stringTail

      const newLineChars = stringTail.match(/\n(?!$)/g)?.length ?? 0
      if (newLineChars >= INITIAL_READ_LINES || position === 0) {
        this.queue = stringTail.split(/\n(?!$)/).slice(-INITIAL_READ_LINES)
        break
      }
    }

    fs.closeSync(file)
    this.emit('init', this.queue)

    fs.watchFile(this.filename, { interval: POLLING_INTERVAL }, (curr, prev) => {
      this.update(curr, prev)
    })
  }

  update(curr: fs.Stats, prev: fs.Stats) {
    if (curr.ino !== prev.ino || curr.size < prev.size) {
      this.eof = 0
    }

    const file = fs.openSync(this.filename, 'r')
    const bufferSize = curr.size - this.eof
    const buffer = Buffer.alloc(bufferSize)
    fs.readSync(file, buffer, 0, bufferSize, this.eof)
    fs.closeSync(file)

    const newLines = buffer.toString().split(/\n(?!$)/)
    if (newLines.length >= INITIAL_READ_LINES) {
      this.queue = newLines.slice(-INITIAL_READ_LINES)
    } else {
      this.queue = this.queue.slice(-INITIAL_READ_LINES + newLines.length).concat(newLines)
    }
    this.eof = curr.size

    this.emit('update', newLines)
  }
}
