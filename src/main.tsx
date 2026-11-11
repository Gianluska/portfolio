import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

// Sem StrictMode: a cena é dona de um contexto WebGL e de uma timeline que não
// devem ser montados duas vezes.
createRoot(document.getElementById('root')!).render(<App />)
