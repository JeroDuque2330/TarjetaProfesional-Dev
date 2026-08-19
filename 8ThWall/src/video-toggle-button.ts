import * as ecs from '@8thwall/ecs'

/**
 * video-toggle-button.ts
 * Control total de reproducción y pausa del video en Realidad Aumentada para Jerónimo.
 * - Soporta 'Video_.mp4'.
 * - No inicia automáticamente con audio bloqueado (inicia pausado por defecto).
 * - Botón flotante Glassmorphism en la esquina inferior derecha con indicador de estado (SVG Play/Pause).
 * - Detección de toques en botón UI de pantalla, plano 3D y botón 3D del plano.
 * - Pausa automática al perder el objetivo de imagen (xrimagelost).
 */

let lastToggleTime = 0
let isVideoPlaying = false
let uiFloatingBtn: HTMLButtonElement | null = null

function updateUiFloatingBtn(playing: boolean) {
  if (!uiFloatingBtn) return
  if (playing) {
    uiFloatingBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>'
    uiFloatingBtn.style.backgroundColor = 'rgba(15, 23, 42, 0.85)'
    uiFloatingBtn.setAttribute('title', 'Pausar Video')
  } else {
    uiFloatingBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px;"><polygon points="5,3 19,12 5,21" /></svg>'
    uiFloatingBtn.style.backgroundColor = 'rgba(173, 80, 255, 0.85)'
    uiFloatingBtn.setAttribute('title', 'Reproducir Video')
  }
}

function findVideoElement(world: ecs.World): HTMLVideoElement | null {
  const threeState = (world as any).three
  if (threeState?.entityToObject) {
    for (const [_, obj] of threeState.entityToObject.entries()) {
      let found: HTMLVideoElement | null = null
      obj.traverse((child: any) => {
        if (child.material?.map?.image instanceof HTMLVideoElement) {
          found = child.material.map.image
        }
      })
      if (found) return found
    }
  }

  const videos = Array.from(document.querySelectorAll('video'))
  const matched = videos.find(v => {
    const s = v.src || v.querySelector('source')?.src || ''
    return s.includes('Video') || s.includes('.mp4')
  })
  return matched || videos[0] || null
}

function findVideoPlaneEid(world: ecs.World): ecs.Eid | null {
  const threeState = (world as any).three
  if (!threeState?.entityToObject) return null

  const VideoControls = (ecs as any).VideoControls
  for (const [eid, obj] of threeState.entityToObject.entries()) {
    const objName = (obj?.name || '').toLowerCase()
    if (objName.includes('plano') || objName.includes('plane') || (VideoControls && VideoControls.has(world, eid))) {
      return eid
    }
  }
  return null
}

export function playVideo(world: ecs.World) {
  const planeEid = findVideoPlaneEid(world)
  const VideoControls = (ecs as any).VideoControls
  if (planeEid && VideoControls && VideoControls.has(world, planeEid)) {
    try {
      VideoControls.mutate(world, planeEid, (cursor: any) => {
        cursor.paused = false
      })
    } catch (e) {}
  }

  const vid = findVideoElement(world)
  if (vid) {
    vid.muted = false
    vid.play().catch(() => {
      vid.muted = true
      vid.play().then(() => {
        const unlockAudio = () => {
          vid.muted = false
          window.removeEventListener('touchstart', unlockAudio)
          window.removeEventListener('click', unlockAudio)
        }
        window.addEventListener('touchstart', unlockAudio, {once: true})
        window.addEventListener('click', unlockAudio, {once: true})
      })
    })
  }

  isVideoPlaying = true
  updateUiFloatingBtn(true)
}

export function pauseVideo(world: ecs.World) {
  const planeEid = findVideoPlaneEid(world)
  const VideoControls = (ecs as any).VideoControls
  if (planeEid && VideoControls && VideoControls.has(world, planeEid)) {
    try {
      VideoControls.mutate(world, planeEid, (cursor: any) => {
        cursor.paused = true
      })
    } catch (e) {}
  }

  const vid = findVideoElement(world)
  if (vid) {
    vid.pause()
  }

  isVideoPlaying = false
  updateUiFloatingBtn(false)
}

export function toggleVideo(world: ecs.World) {
  const now = Date.now()
  if (now - lastToggleTime < 400) return
  lastToggleTime = now

  if (isVideoPlaying) {
    pauseVideo(world)
  } else {
    playVideo(world)
  }
}

function createFloatingButton(world: ecs.World) {
  if (document.getElementById('video-control-toggle-btn')) {
    uiFloatingBtn = document.getElementById('video-control-toggle-btn') as HTMLButtonElement
    return
  }

  uiFloatingBtn = document.createElement('button')
  uiFloatingBtn.id = 'video-control-toggle-btn'
  uiFloatingBtn.setAttribute('aria-label', 'Reproducir o Pausar Video')

  Object.assign(uiFloatingBtn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(173, 80, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    webkitBackdropFilter: 'blur(8px)',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    outline: 'none',
    transition: 'transform 0.15s ease, background-color 0.2s ease',
    userSelect: 'none',
    webkitUserSelect: 'none',
    touchAction: 'manipulation',
  })

  updateUiFloatingBtn(false)

  uiFloatingBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    if (uiFloatingBtn) uiFloatingBtn.style.transform = 'scale(0.92)'
  })

  const resetScale = () => {
    if (uiFloatingBtn) uiFloatingBtn.style.transform = 'scale(1)'
  }
  uiFloatingBtn.addEventListener('pointerup', resetScale)
  uiFloatingBtn.addEventListener('pointercancel', resetScale)

  uiFloatingBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleVideo(world)
  })

  document.body.appendChild(uiFloatingBtn)
}

const VideoToggleButtonComponent = ecs.registerComponent({
  name: 'video-toggle-button',
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
      toggleVideo(world)
    })
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
      toggleVideo(world)
    })
    world.events.addListener(component.eid, 'click', () => {
      toggleVideo(world)
    })
  },
})

try {
  ecs.registerComponent({
    name: 'video-button',
    add: (world, component) => {
      world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
        toggleVideo(world)
      })
      world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
        toggleVideo(world)
      })
      world.events.addListener(component.eid, 'click', () => {
        toggleVideo(world)
      })
    },
  })
} catch (e) {}

let isVideoBehaviorAttached = false
ecs.registerComponent({
  name: 'video-global-behavior',
  add: (world) => {
    if (isVideoBehaviorAttached) return
    isVideoBehaviorAttached = true

    // Crear el botón flotante de UI en pantalla
    createFloatingButton(world)

    // Asegurar que el video inicie pausado por defecto
    setTimeout(() => {
      pauseVideo(world)
    }, 300)

    // Detectar toques en elementos de UI del plano (Botón de pausa 3D)
    world.events.addListener(world.events.globalId, ecs.input.UI_CLICK, (event: any) => {
      if (event?.target) {
        const obj = (world as any).three?.entityToObject?.get(event.target)
        const objName = (obj?.name || '').toLowerCase()
        if (
          objName.includes('button') ||
          objName.includes('icon') ||
          objName.includes('text') ||
          objName.includes('plano') ||
          objName.includes('plane')
        ) {
          toggleVideo(world)
        }
      }
    })

    // Pausar si se pierde de vista el Target
    window.addEventListener('xrimagelost', () => {
      if (isVideoPlaying) {
        pauseVideo(world)
      }
    })
  },
})

export default VideoToggleButtonComponent
