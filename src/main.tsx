import { createRoot } from 'react-dom/client'
import '@fontsource/fraunces/latin-600-italic.css'
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-500.css'
import '@fontsource/instrument-sans/latin-600.css'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

createRoot(root).render(<App />)
