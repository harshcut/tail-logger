import { Server } from 'socket.io'
import TailFile from './tail-file'

const tailFile = new TailFile('server.log')
tailFile.init()

const io = new Server(8000, { cors: { origin: 'http://localhost:3000' } })

io.on('connection', (socket) => {
  const queue = tailFile.get()
  socket.emit('init', queue)

  tailFile.on('update', (data) => socket.emit('update', data))
})
