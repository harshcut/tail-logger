import fs from 'fs'
import events from 'events'

const INITIAL_READ_LINES = 10
const READ_CHUNK_SIZE = 8

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
      if (newLineChars >= INITIAL_READ_LINES) {
        this.queue = stringTail.split(/\n(?!$)/).slice(-INITIAL_READ_LINES)
        break
      }
    }

    fs.closeSync(file)
    this.emit('init', this.queue)
  }
}
