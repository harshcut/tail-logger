import * as React from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:8000')

export default function App() {
  const [logs, setLogs] = React.useState<string[]>([])

  React.useEffect(() => {
    const onInit = (data: string[]) => setLogs(data)
    const onUpdate = (data: string[]) => setLogs((logs) => [...logs, ...data])

    socket.on('init', onInit)
    socket.on('update', onUpdate)

    return () => {
      socket.off('init', onInit)
      socket.off('update', onUpdate)
    }
  }, [])

  return (
    <main>
      <div>Tail Logger</div>
      <pre>
        {logs.map((log, idx) => {
          if (log === '') return <br key={idx} />
          return <div key={idx}>{log}</div>
        })}
      </pre>
    </main>
  )
}
