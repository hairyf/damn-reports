import { listen } from '@tauri-apps/api/event'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import valtio from 'valtio-define'
import persistent from 'valtio-define/plugins/persistent'
import App from './App.tsx'
import { Provider } from './provider.tsx'
import { store } from './store'
import './styles/main.css'

valtio.use(persistent())

listen('trigger_generate_daily_report', () => {
  store.llm.generateDailyReport()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
)
