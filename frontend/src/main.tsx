import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/public/Toast.css'
import { App } from './App'
import '@fortawesome/fontawesome-free/css/all.min.css';

if (!localStorage.getItem('medix-language')) {
  localStorage.setItem('medix-language', 'vi');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)