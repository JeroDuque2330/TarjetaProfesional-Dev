const configureTargets = () => {
  if (window.XR8 && window.XR8.XrController) {
    try {
      window.XR8.XrController.configure({
        imageTargetData: [
          require('../image-targets/TarjetaProfesional.json'),
          require('../image-targets/TarjetaProfe.json'),
        ],
      })
    } catch (err) {
      console.warn('[app.js] Error al configurar Image Targets:', err)
    }
  }
}

if (window.XR8 && window.XR8.XrController) {
  configureTargets()
} else {
  window.addEventListener('xrloaded', configureTargets)
}