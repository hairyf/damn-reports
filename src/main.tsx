import { listen } from '@tauri-apps/api/event'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import valtio from 'valtio-define'
import persistent from 'valtio-define/plugins/persistent'
import App from './App.tsx'
import { Provider } from './provider.tsx'
import { store } from './store'
import { MAIN_SESSION_ID } from './store/modules/chat'
import './styles/main.css'

valtio.use(persistent())

listen('trigger_generate_daily_report', () => store.report.generateDailyReport())
listen('trigger_main_memory_storage', async () => {
  await store.chat.startStreaming('储存今天的记忆')
  store.chat.clearSessionMessages(MAIN_SESSION_ID)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>,
)
