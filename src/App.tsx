import { Suspense } from 'react'
import { useNavigate, useRoutes } from 'react-router-dom'
import { useMount } from 'react-use'
import routes from '~react-pages'

function App() {
  const navigate = useNavigate()

  useMount(() => window.navigate = navigate)

  return (
    <layouts.default>
      <Suspense fallback={<p>Loading...</p>}>
        {useRoutes(routes)}
      </Suspense>
    </layouts.default>
  )
}
export default App
