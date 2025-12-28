import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import routes from '~react-pages'

function App() {
  return (
    <div className="w-full min-h-screen relative">
      <Suspense fallback={<p>Loading...</p>}>
        {useRoutes(routes)}
      </Suspense>
    </div>
  )
}
export default App
