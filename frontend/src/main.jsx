import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { SoftUIControllerProvider } from 'context'
import lottie from 'lottie-web'

/* Replace CSS-square fallback with running-cat the moment the bundle executes */
const _splashEl = document.getElementById('app-loader-anim')
if (_splashEl) {
  _splashEl.innerHTML = ''
  lottie.loadAnimation({
    container: _splashEl,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/running-cat.json',
  })
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SoftUIControllerProvider>
      <App />
    </SoftUIControllerProvider>
  </BrowserRouter>,
)
