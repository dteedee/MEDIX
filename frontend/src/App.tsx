import { useEffect, useState } from 'react'
import axios from 'axios'

export function App() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    axios.get('/api/hello')
      .then(r => setMessage(r.data.message ?? 'No message'))
      .catch(() => setMessage('API not available yet'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Medix</h1>
      <p>{message}</p>
    </div>
  )
}


