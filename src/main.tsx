import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

// Scene selection is in-memory; a new document always starts at the hero.
history.scrollRestoration = 'manual'
if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(<App />)
