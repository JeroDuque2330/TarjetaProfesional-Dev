// Capturador de promesas no controladas en el simulador de 8th Wall
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (String(event.reason).includes('fetch') || event.reason.name === 'TypeError')) {
    console.warn('[8thwall] Advertencia de fetch no bloqueante en simulador:', event.reason)
    event.preventDefault()
  }
})

const configureTargets = async () => {
  if (window.XR8 && window.XR8.XrController) {
    try {
      const configurePromise = window.XR8.XrController.configure({
        imageTargetData: [
          require('../image-targets/TarjetaProfesional.json'),
        ],
      })

      if (configurePromise && typeof configurePromise.catch === 'function') {
        configurePromise.catch((err) => {
          console.warn('[app.js] Aviso al cargar target en simulador:', err)
        })
      }
    } catch (err) {
      console.warn('[app.js] Error capturado en configure:', err)
    }
  }
}

if (window.XR8 && window.XR8.XrController) {
  configureTargets()
} else {
  window.addEventListener('xrloaded', () => {
    configureTargets()
  })
}
