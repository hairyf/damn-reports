import { Suspense } from 'react'
import { useNavigate, useRoutes } from 'react-router-dom'
import { useMount } from 'react-use'
import { routes } from "~react-virtual-router";

function App() {
  const navigate = useNavigate()

  useMount(() => window.navigate = navigate)

  return (
    <Suspense fallback={<p>Loading...</p>}>
      {useRoutes(routes)}
    </Suspense>
  )
}
export default App
