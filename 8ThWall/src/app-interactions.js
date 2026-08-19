import * as ecs from '@8thwall/ecs'

/**
 * app-interactions.js
 * Sistema unificado de interacción táctil y Raycasting 3D para la Tarjeta Profesional WebAR.
 * - Raycast 3D exacto con Three.js sobre Snoop, Video y Redes Sociales.
 * - Fallback por proximidad 2D en pantalla para toques móviles.
 * - Control de animaciones de Snoop (Bailecito Hip Hop / Bailecito Tranquilito).
 * - Redirección segura para WhatsApp, Instagram y Spotify.
 * - Control Play/Pause del video.
 */

export const SOCIAL_URLS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

const CLIPS = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
let currentClipIndex = 0
let lastAvatarToggle = 0
let lastUrlOpenTime = 0
let lastVideoToggleTime = 0
let isVideoPlaying = false

/**
 * Redirección segura para dispositivos móviles
 */
export function navigateToUrl(url) {
  const now = Date.now()
  if (now - lastUrlOpenTime < 600) return
  lastUrlOpenTime = now

  console.log(`[app-interactions] Abriendo URL: ${url}`)
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url
    }
  } catch (err) {
    window.location.href = url
  }
}

/**
 * Efecto visual de escala al tocar
 */
export function pulseObjectScale(obj) {
  try {
    if (!obj || !obj.scale) return
    const orig = {x: obj.scale.x, y: obj.scale.y, z: obj.scale.z}
    obj.scale.set(orig.x * 1.25, orig.y * 1.25, orig.z * 1.25)
    setTimeout(() => {
      if (obj && obj.scale) obj.scale.set(orig.x, orig.y, orig.z)
    }, 200)
  } catch (e) {}
}

/**
 * Alternar animación de Snoop
 */
export function toggleAvatarAnimation(world, targetEid) {
  const now = Date.now()
  if (now - lastAvatarToggle < 400) return
  lastAvatarToggle = now

  currentClipIndex = (currentClipIndex + 1) % CLIPS.length
  const nextClip = CLIPS[currentClipIndex]
  console.log(`[app-interactions] Cambiando animación de Snoop a: ${nextClip}`)

  // Buscar la entidad de Snoop si no se pasó eid
  let snoopEid = targetEid
  if (!snoopEid) {
    for (const eid of world.allEntities) {
      if (ecs.GltfModel && ecs.GltfModel.has(world, eid)) {
        snoopEid = eid
        break
      }
    }
  }

  if (snoopEid && ecs.GltfModel && ecs.GltfModel.has(world, snoopEid)) {
    try {
      ecs.GltfModel.mutate(world, snoopEid, (cursor) => {
        cursor.animationClip = nextClip
        cursor.loop = true
        cursor.paused = false
      })
    } catch (err) {
      console.error('[app-interactions] Error al mutar animación:', err)
    }
  }
}

/**
 * Alternar reproducción / pausa del video
 */
export function toggleVideo(world) {
  const now = Date.now()
  if (now - lastVideoToggleTime < 400) return
  lastVideoToggleTime = now

  isVideoPlaying = !isVideoPlaying
  console.log(`[app-interactions] Alternando video. Reproduciendo: ${isVideoPlaying}`)

  // 1. Mutar VideoControls en ECS
  if (ecs.VideoControls) {
    for (const eid of world.allEntities) {
      if (ecs.VideoControls.has(world, eid)) {
        try {
          ecs.VideoControls.mutate(world, eid, (cursor) => {
            cursor.paused = !isVideoPlaying
          })
        } catch (e) {}
      }
    }
  }

  // 2. Controlar elemento HTMLVideoElement directamente
  const videos = Array.from(document.querySelectorAll('video'))
  for (const vid of videos) {
    if (isVideoPlaying) {
      vid.play().catch(() => {
        vid.muted = true
        vid.play()
      })
    } else {
      vid.pause()
    }
  }
}

/**
 * Manejador central de toques por Raycasting 3D y proximidad en pantalla
 */
function handleTouchInteraction(world, clientX, clientY) {
  const threeState = world.three
  if (!threeState) return

  const camera = threeState.activeCamera
  const renderer = threeState.renderer
  const canvas = renderer?.domElement || document.querySelector('canvas')
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()
  const entityToObject = threeState.entityToObject
  if (!entityToObject) return

  // Recopilar objetos interactivos de la escena
  const interactiveItems = []

  for (const [eid, obj] of entityToObject.entries()) {
    if (!obj || obj.visible === false) continue
    const name = (obj.name || '').toLowerCase()

    let type = null
    if (name.includes('snoop') || (ecs.GltfModel && ecs.GltfModel.has(world, eid))) {
      type = 'snoop'
    } else if (name.includes('whatsapp') || name.includes('wapp')) {
      type = 'whatsapp'
    } else if (name.includes('instagram') || name.includes('insta')) {
      type = 'instagram'
    } else if (name.includes('spotify') || name.includes('spoti')) {
      type = 'spotify'
    } else if (name.includes('button') || name.includes('plane') || (ecs.VideoControls && ecs.VideoControls.has(world, eid))) {
      type = 'video'
    } else if (ecs.Ui && ecs.Ui.has(world, eid)) {
      // Diferenciar UI por posición X
      const posX = obj.position?.x || 0
      if (posX < -0.12) type = 'whatsapp'
      else if (posX > 0.12) type = 'spotify'
      else type = 'instagram'
    }

    if (type) {
      interactiveItems.push({eid, obj, type})
    }
  }

  // 1. Raycast 3D con Three.js
  try {
    const THREE = window.THREE || camera.constructor?.prototype ? camera.constructor : null
    const RaycasterCtor = THREE?.Raycaster || window.THREE?.Raycaster
    if (RaycasterCtor) {
      const raycaster = new RaycasterCtor()
      const mouse = {
        x: ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
        y: -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1,
      }
      raycaster.setFromCamera(mouse, camera)

      const meshesToTest = []
      const meshToItemMap = new Map()

      for (const item of interactiveItems) {
        item.obj.traverse((child) => {
          if (child.isMesh) {
            meshesToTest.push(child)
            meshToItemMap.set(child, item)
          }
        })
      }

      const intersects = raycaster.intersectObjects(meshesToTest, false)
      if (intersects && intersects.length > 0) {
        const hitMesh = intersects[0].object
        const matchedItem = meshToItemMap.get(hitMesh)
        if (matchedItem) {
          pulseObjectScale(matchedItem.obj)
          triggerAction(world, matchedItem.type, matchedItem.eid)
          return
        }
      }
    }
  } catch (rayErr) {
    console.warn('[app-interactions] Raycast 3D error:', rayErr)
  }

  // 2. Proyección 2D en pantalla (Fallback por proximidad)
  let closestMatch = null
  let minDistance = 140

  for (const item of interactiveItems) {
    try {
      const Vector3Class = camera.position?.constructor
      if (Vector3Class && camera.project) {
        const worldPos = new Vector3Class()
        if (item.obj.getWorldPosition) item.obj.getWorldPosition(worldPos)
        else if (item.obj.matrixWorld) worldPos.setFromMatrixPosition(item.obj.matrixWorld)

        const screenPoint = worldPos.clone()
        camera.project(screenPoint)

        if (screenPoint.z > -1 && screenPoint.z < 1) {
          const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left
          const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top
          const dist = Math.hypot(screenX - clientX, screenY - clientY)

          if (dist < minDistance) {
            minDistance = dist
            closestMatch = item
          }
        }
      }
    } catch (e) {}
  }

  if (closestMatch) {
    pulseObjectScale(closestMatch.obj)
    triggerAction(world, closestMatch.type, closestMatch.eid)
  }
}

/**
 * Ejecutar la acción según el tipo de elemento
 */
function triggerAction(world, type, eid) {
  if (type === 'snoop') {
    toggleAvatarAnimation(world, eid)
  } else if (type === 'whatsapp') {
    navigateToUrl(SOCIAL_URLS.whatsapp)
  } else if (type === 'instagram') {
    navigateToUrl(SOCIAL_URLS.instagram)
  } else if (type === 'spotify') {
    navigateToUrl(SOCIAL_URLS.spotify)
  } else if (type === 'video') {
    toggleVideo(world)
  }
}

// ---------------------------------------------------------------------------
// Registro de Componentes ECS
// ---------------------------------------------------------------------------

ecs.registerComponent({
  name: 'character-toggle',
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => toggleAvatarAnimation(world, component.eid))
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => toggleAvatarAnimation(world, component.eid))
    world.events.addListener(component.eid, 'click', () => toggleAvatarAnimation(world, component.eid))
  },
})

ecs.registerComponent({
  name: 'video-button',
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => toggleVideo(world))
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => toggleVideo(world))
    world.events.addListener(component.eid, 'click', () => toggleVideo(world))
  },
})

ecs.registerComponent({
  name: 'open-whatsapp',
  add: (world, component) => {
    const act = () => navigateToUrl(SOCIAL_URLS.whatsapp)
    world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
    world.events.addListener(component.eid, 'click', act)
  },
})

ecs.registerComponent({
  name: 'open-instagram',
  add: (world, component) => {
    const act = () => navigateToUrl(SOCIAL_URLS.instagram)
    world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
    world.events.addListener(component.eid, 'click', act)
  },
})

ecs.registerComponent({
  name: 'open-spotify',
  add: (world, component) => {
    const act = () => navigateToUrl(SOCIAL_URLS.spotify)
    world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
    world.events.addListener(component.eid, 'click', act)
  },
})

// ---------------------------------------------------------------------------
// Behavior Global con Listeners Directos al Canvas
// ---------------------------------------------------------------------------
let isCanvasListenerAttached = false

ecs.registerBehavior((world) => {
  if (isCanvasListenerAttached) return
  const canvas = world.three?.renderer?.domElement || document.querySelector('canvas')
  if (!canvas) return
  isCanvasListenerAttached = true

  console.log('[app-interactions] Canvas de Three.js vinculado con listeners de toque global.')

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      handleTouchInteraction(world, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    }
  }, {passive: true})

  canvas.addEventListener('click', (e) => {
    handleTouchInteraction(world, e.clientX, e.clientY)
  })
})
