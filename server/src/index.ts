import { Server, Socket } from 'socket.io'
import TailFile from './tail-file'

const tailFile = new TailFile('server.log')
tailFile.init()

const io = new Server(8000, { cors: { origin: 'http://localhost:3000' } })
const ioClients = new Set<Socket>()

io.on('connection', (socket) => {
  socket.emit('init', tailFile.get())

  ioClients.add(socket)
  socket.on('disconnect', () => ioClients.delete(socket))
})

tailFile.on('update', (data) => {
  ioClients.forEach((socket) => socket.emit('update', data))
})
