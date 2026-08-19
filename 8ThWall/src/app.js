const configureTargets = () => {
  if (window.XR8 && window.XR8.XrController) {
    window.XR8.XrController.configure({
      imageTargetData: [
        require('../image-targets/TarjetaProfesional.json'),
        require('../image-targets/TarjetaProfe.json'),
      ],
    })
  }
}

if (window.XR8 && window.XR8.XrController) {
  configureTargets()
} else {
  window.addEventListener('xrloaded', configureTargets)
}