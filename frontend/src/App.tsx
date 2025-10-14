import { useEffect, useState } from 'react'
import axios from 'axios'
import AddCmsPage from './components/AddCmsPage'
import CmspageList from './components/CmspageList'

export function App() {
  const [message, setMessage] = useState<string>('Loading...')
  const [editItem, setEditItem] = useState<any | null>(null)
  const [refreshFlag, setRefreshFlag] = useState(0)

  useEffect(() => {
    axios.get('/api/hello')
      .then(r => setMessage(r.data.message ?? 'No message'))
      .catch(() => setMessage('API not available yet'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Medix</h1>
      <p>{message}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
        <div>
          <CmspageList onEdit={(it) => setEditItem(it)} key={`list-${refreshFlag}`} />
        </div>
        <div>
          <AddCmsPage editItem={editItem} onSaved={() => { setEditItem(null); setRefreshFlag(f => f + 1) }} />
        </div>
      </div>
    </div>
  )
}


