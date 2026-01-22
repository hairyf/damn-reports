import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import valtio from 'valtio-define'
import persistent from 'valtio-define/plugins/persistent'
import App from './App.tsx'
import { Provider } from './provider.tsx'
import './styles/main.css'

valtio.use(persistent())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
