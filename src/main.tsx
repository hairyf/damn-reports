import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import valtio from 'valtio-define'
import persistent from 'valtio-define/plugins/persistent'
import App from './App.tsx'
import { Provider } from './provider.tsx'
import { store } from './store'
import './styles/main.css'

valtio.use(persistent())

// Start cron service (replaces Rust scheduler)
store.cron.start().catch(err => console.error('[cron] failed to start:', err))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
)
