import { BrowserRouter } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import valtio from 'valtio-define'
import { persist } from 'valtio-define/plugins/persist'
import { Provider } from './components/provider.tsx'
import App from './app.tsx'
import './styles/main.css'

valtio.use(persist())

// Start cron service (replaces Rust scheduler)
// store.cron.start()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
)
