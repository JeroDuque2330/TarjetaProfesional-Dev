import * as ecs from '@8thwall/ecs'

/**
 * open-url-button.ts
 * Maneja la interacción táctil precisa mediante Raycasting 3D y proximidad 2D para redes sociales de Jerónimo.
 * - WhatsApp: https://wa.me/573154445000
 * - Instagram: https://www.instagram.com/jeronimoduque423/
 * - Spotify: https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede
 * - Feedback visual táctil (pulso de escala 3D).
 * - Redirección segura para navegadores móviles.
 */

export const SOCIAL_LINKS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

let lastUrlOpenTime = 0

/**
 * Redirección directa y segura en dispositivos móviles
 */
export function navigateToUrl(url: string) {
  const now = Date.now()
  if (now - lastUrlOpenTime < 600) return
  lastUrlOpenTime = now

  console.log(`[open-url-button] Redirigiendo a: ${url}`)

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
 * Identifica la URL según el identificador de la entidad, modelo o posición
 */
export function getUrlFromIdentifier(identifierStr: string, customUrl?: string): string | null {
  if (customUrl && customUrl.trim()) return customUrl.trim()

  const str = (identifierStr || '').toLowerCase()

  // 1. WhatsApp
  if (str.includes('whatsapp') || str.includes('whats') || str.includes('wa.me') || str.includes('wsp') || str.includes('wapp')) {
    return SOCIAL_LINKS.whatsapp
  }
  // 2. Instagram
  if (str.includes('instagram') || str.includes('insta') || str.includes('ig')) {
    return SOCIAL_LINKS.instagram
  }
  // 3. Spotify
  if (str.includes('spotify') || str.includes('spoti') || str.includes('music')) {
    return SOCIAL_LINKS.spotify
  }

  return null
}

/**
 * Efecto de pulso en escala 3D para feedback táctil visual
 */
export function pulseObjectScale(obj: any) {
  try {
    if (!obj || !obj.scale) return
    const orig = {x: obj.scale.x, y: obj.scale.y, z: obj.scale.z}
    obj.scale.set(orig.x * 1.3, orig.y * 1.3, orig.z * 1.3)
    setTimeout(() => {
      if (obj && obj.scale) obj.scale.set(orig.x, orig.y, orig.z)
    }, 220)
  } catch (e) {}
}

/**
 * Maneja el toque utilizando Raycaster 3D de Three.js y proximidad 2D
 */
function handleTouchOnIcons(world: ecs.World, clientX: number, clientY: number, targetEid?: ecs.Eid) {
  const threeState = (world as any).three
  if (!threeState) return

  const camera = threeState.activeCamera
  const renderer = threeState.renderer
  const canvas = renderer?.domElement || document.querySelector('canvas')
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()
  const entityToObject = threeState.entityToObject as Map<ecs.Eid, any>
  if (!entityToObject) return

  const logoObjects: {eid: ecs.Eid; obj: any; url: string}[] = []

  for (const [eid, obj] of entityToObject.entries()) {
    if (!obj || obj.visible === false) continue

    let gltfSrc = ''
    try {
      if (ecs.GltfModel && ecs.GltfModel.has(world, eid)) {
        const c: any = ecs.GltfModel.get(world, eid)
        gltfSrc = c.src || c.url || ''
      }
    } catch (e) {}

    const objName = (obj.name || '').toLowerCase()
    const fullId = `${objName} ${gltfSrc}`.toLowerCase()

    if (
      !fullId.includes('snoop') &&
      !fullId.includes('plane') &&
      !fullId.includes('video') &&
      !fullId.includes('camera') &&
      !fullId.includes('light')
    ) {
      let url = getUrlFromIdentifier(fullId)

      // Si es un botón UI de posición
      if (!url && ecs.Ui && ecs.Ui.has(world, eid)) {
        const posX = obj.position?.x || 0
        if (posX < -0.12) url = SOCIAL_LINKS.whatsapp
        else if (posX > 0.12) url = SOCIAL_LINKS.spotify
        else url = SOCIAL_LINKS.instagram
      }

      if (url) {
        logoObjects.push({eid, obj, url})
      }
    }
  }

  // 1. Raycast 3D exacto con Three.js
  try {
    const THREE = (window as any).THREE || camera.constructor?.prototype ? (camera as any).constructor : null
    const RaycasterCtor = THREE?.Raycaster || (window as any).THREE?.Raycaster || (camera as any).raycaster?.constructor
    if (RaycasterCtor) {
      const raycaster = new RaycasterCtor()
      const mouse = {
        x: ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
        y: -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1,
      }
      raycaster.setFromCamera(mouse, camera)

      const meshesToTest: any[] = []
      const meshToLogoMap = new Map<any, {eid: ecs.Eid; obj: any; url: string}>()

      for (const item of logoObjects) {
        item.obj.traverse((child: any) => {
          if (child.isMesh) {
            meshesToTest.push(child)
            meshToLogoMap.set(child, item)
          }
        })
      }

      const intersects = raycaster.intersectObjects(meshesToTest, false)
      if (intersects && intersects.length > 0) {
        const hitMesh = intersects[0].object
        const matchedLogo = meshToLogoMap.get(hitMesh)
        if (matchedLogo) {
          console.log(`[open-url-button] Raycast 3D exacto: ${matchedLogo.url}`)
          pulseObjectScale(matchedLogo.obj)
          navigateToUrl(matchedLogo.url)
          return
        }
      }
    }
  } catch (rayErr) {}

  // 2. Proyección 2D en pantalla (Fallback por proximidad)
  let closestMatch: {obj: any; url: string; dist: number} | null = null
  let minDistance = 120

  for (const item of logoObjects) {
    const obj = item.obj
    let objDist = Infinity

    try {
      const Vector3Class = camera.position?.constructor
      if (Vector3Class && camera.project) {
        const worldPos = new Vector3Class()
        if (obj.getWorldPosition) obj.getWorldPosition(worldPos)
        else if (obj.matrixWorld) worldPos.setFromMatrixPosition(obj.matrixWorld)

        const screenPoint = worldPos.clone()
        camera.project(screenPoint)

        if (screenPoint.z > -1 && screenPoint.z < 1) {
          const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left
          const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top
          objDist = Math.hypot(screenX - clientX, screenY - clientY)
        }
      }
    } catch (e) {}

    if (objDist < minDistance) {
      minDistance = objDist
      closestMatch = {obj, url: item.url, dist: objDist}
    }
  }

  if (closestMatch && closestMatch.url) {
    console.log(`[open-url-button] Proximidad 2D: ${closestMatch.url} (${Math.round(closestMatch.dist)}px)`)
    pulseObjectScale(closestMatch.obj)
    navigateToUrl(closestMatch.url)
  }
}

/**
 * Registro de Componentes ECS
 */
const OpenUrlButtonComponent = ecs.registerComponent({
  name: 'open-url-button',
  schema: {
    url: ecs.string,
    target: ecs.string,
  },
  schemaDefaults: {
    url: '',
    target: '_blank',
  },
  add: (world, component) => {
    const act = () => {
      const obj = (world as any).three?.entityToObject?.get(component.eid)
      const url = getUrlFromIdentifier(obj?.name || '', (component as any).schema?.url)
      if (url) {
        if (obj) pulseObjectScale(obj)
        navigateToUrl(url)
      }
    }
    world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
    world.events.addListener(component.eid, 'click', act)
  },
})

// Registro de componentes específicos de redes sociales
try {
  ecs.registerComponent({
    name: 'open-whatsapp',
    add: (world, component) => {
      const act = () => navigateToUrl(SOCIAL_LINKS.whatsapp)
      world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
      world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
      world.events.addListener(component.eid, 'click', act)
    },
  })

  ecs.registerComponent({
    name: 'open-instagram',
    add: (world, component) => {
      const act = () => navigateToUrl(SOCIAL_LINKS.instagram)
      world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
      world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
      world.events.addListener(component.eid, 'click', act)
    },
  })

  ecs.registerComponent({
    name: 'open-spotify',
    add: (world, component) => {
      const act = () => navigateToUrl(SOCIAL_LINKS.spotify)
      world.events.addListener(component.eid, ecs.input.UI_CLICK, act)
      world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, act)
      world.events.addListener(component.eid, 'click', act)
    },
  })
} catch (e) {}

let isGlobalAttached = false
ecs.registerComponent({
  name: 'open-url-global-behavior',
  add: (world) => {
    if (isGlobalAttached) return
    isGlobalAttached = true

    world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (event: any) => {
      if (event?.position) {
        handleTouchOnIcons(world, event.position.x, event.position.y, event.target)
      }
    })

    const canvas = (world as any).three?.renderer?.domElement || document.querySelector('canvas') || window
    canvas.addEventListener('touchend', ((e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        handleTouchOnIcons(world, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    }) as any, {passive: true})

    canvas.addEventListener('click', ((e: MouseEvent) => {
      handleTouchOnIcons(world, e.clientX, e.clientY)
    }) as any)
  },
})

export default OpenUrlButtonComponent
