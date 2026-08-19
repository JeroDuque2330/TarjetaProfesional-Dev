import * as ecs from '@8thwall/ecs'

export const SOCIAL_LINKS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

let lastUrlOpenTime = 0

export function navigateToUrl(url: string) {
  const now = Date.now()
  if (now - lastUrlOpenTime < 450) return
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

export function getExactUrlForEntity(world: ecs.World, eid: ecs.Eid): string {
  const eidStr = String(eid).toLowerCase()

  // 1. Coincidencia por ID de entidad
  if (eidStr.includes('wapp') || eidStr.includes('whats')) return SOCIAL_LINKS.whatsapp
  if (eidStr.includes('insta')) return SOCIAL_LINKS.instagram
  if (eidStr.includes('spoti')) return SOCIAL_LINKS.spotify

  // 2. Coincidencia por datos del componente
  try {
    if (OpenUrlButtonComponent && OpenUrlButtonComponent.has(world, eid)) {
      const data: any = OpenUrlButtonComponent.get(world, eid)
      if (data?.url && typeof data.url === 'string' && data.url.startsWith('http')) {
        const u = data.url.toLowerCase()
        if (u.includes('wa.me') || u.includes('whatsapp')) return SOCIAL_LINKS.whatsapp
        if (u.includes('instagram')) return SOCIAL_LINKS.instagram
        if (u.includes('spotify')) return SOCIAL_LINKS.spotify
        return data.url
      }
    }
  } catch (e) {}

  // 3. Coincidencia por objeto 3D
  const threeState = (world as any).three
  const obj = threeState?.entityToObject?.get(eid)
  const objName = (obj?.name || '').toLowerCase()
  if (objName.includes('whatsapp') || objName.includes('wapp')) return SOCIAL_LINKS.whatsapp
  if (objName.includes('instagram') || objName.includes('insta')) return SOCIAL_LINKS.instagram
  if (objName.includes('spotify') || objName.includes('spoti')) return SOCIAL_LINKS.spotify

  // 4. Posición local: X < -0.1 = WhatsApp, X > 0.1 = Spotify, Centro = Instagram
  const posX = obj?.position?.x ?? 0
  if (posX < -0.1) return SOCIAL_LINKS.whatsapp
  if (posX > 0.1) return SOCIAL_LINKS.spotify
  return SOCIAL_LINKS.instagram
}

/**
 * Componente principal OpenUrlButtonComponent
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
    const triggerOpen = () => {
      const url = getExactUrlForEntity(world, component.eid)
      console.log(`[open-url-button] Activado para entidad ${component.eid} -> ${url}`)
      const obj = (world as any).three?.entityToObject?.get(component.eid)
      if (obj) pulseObjectScale(obj)
      navigateToUrl(url)
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, triggerOpen)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, triggerOpen)
    world.events.addListener(component.eid, 'click', triggerOpen)
  },
})

/**
 * Controlador de toque táctil y raycast global
 */
function handleGlobalTouch(world: ecs.World, rawX: number, rawY: number, targetEid?: ecs.Eid) {
  // Si el evento viene con target directo
  if (targetEid) {
    const directUrl = getExactUrlForEntity(world, targetEid)
    if (directUrl) {
      console.log(`[open-url-button] Target directo detectado: ${targetEid} -> ${directUrl}`)
      const obj = (world as any).three?.entityToObject?.get(targetEid)
      if (obj) pulseObjectScale(obj)
      navigateToUrl(directUrl)
      return
    }
  }

  const threeState = (world as any).three
  if (!threeState) return

  const camera = threeState.activeCamera
  const renderer = threeState.renderer
  const canvas = renderer?.domElement || document.querySelector('canvas')
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()

  // Normalizar coordenadas independientemente de si vienen en píxeles (0..width) o normalizadas (0..1)
  let normX = 0
  let normY = 0
  let pixelX = 0
  let pixelY = 0

  if (rawX <= 1.0 && rawY <= 1.0 && rawX >= 0 && rawY >= 0) {
    // Vienen normalizadas de 8th Wall (0..1)
    normX = rawX * 2 - 1
    normY = -(rawY * 2 - 1)
    pixelX = rawX * canvasRect.width + canvasRect.left
    pixelY = rawY * canvasRect.height + canvasRect.top
  } else {
    // Vienen en píxeles de pantalla (clientX, clientY)
    normX = ((rawX - canvasRect.left) / canvasRect.width) * 2 - 1
    normY = -((rawY - canvasRect.top) / canvasRect.height) * 2 + 1
    pixelX = rawX
    pixelY = rawY
  }

  const entityToObject = threeState.entityToObject as Map<ecs.Eid, any>
  if (!entityToObject) return

  const socialButtons: {eid: ecs.Eid; obj: any; url: string}[] = []

  for (const [eid, obj] of entityToObject.entries()) {
    if (!obj || obj.visible === false) continue
    const eidStr = String(eid).toLowerCase()
    const objName = (obj.name || '').toLowerCase()

    if (
      eidStr.includes('wapp') ||
      eidStr.includes('insta') ||
      eidStr.includes('spoti') ||
      objName.includes('whatsapp') ||
      objName.includes('instagram') ||
      objName.includes('spotify') ||
      (OpenUrlButtonComponent && OpenUrlButtonComponent.has(world, eid))
    ) {
      if (
        !objName.includes('snoop') &&
        !objName.includes('plano') &&
        !objName.includes('plane') &&
        !objName.includes('camera') &&
        !objName.includes('light') &&
        objName !== 'button' &&
        objName !== 'text' &&
        objName !== 'icon'
      ) {
        const url = getExactUrlForEntity(world, eid)
        socialButtons.push({eid, obj, url})
      }
    }
  }

  // 1. Raycast 3D con Three.js
  try {
    const THREE = (window as any).THREE || camera.constructor?.prototype ? (camera as any).constructor : null
    const RaycasterCtor = THREE?.Raycaster || (window as any).THREE?.Raycaster || (camera as any).raycaster?.constructor
    if (RaycasterCtor) {
      const raycaster = new RaycasterCtor()
      raycaster.setFromCamera({x: normX, y: normY}, camera)

      const meshes: any[] = []
      const meshToEntry = new Map<any, {eid: ecs.Eid; obj: any; url: string}>()

      for (const item of socialButtons) {
        item.obj.traverse((child: any) => {
          if (child.isMesh) {
            meshes.push(child)
            meshToEntry.set(child, item)
          }
        })
      }

      const intersects = raycaster.intersectObjects(meshes, true)
      if (intersects && intersects.length > 0) {
        for (const hit of intersects) {
          let curr: any = hit.object
          while (curr) {
            const matched = socialButtons.find(item => item.obj === curr) || meshToEntry.get(curr)
            if (matched) {
              console.log(`[open-url-button] Raycast 3D impactó en: ${matched.url}`)
              pulseObjectScale(matched.obj)
              navigateToUrl(matched.url)
              return
            }
            curr = curr.parent
          }
        }
      }
    }
  } catch (e) {}

  // 2. Proyección 2D en pantalla con actualización forzada de matrices
  let bestMatch: {obj: any; url: string; dist: number} | null = null
  let minDistance = 65

  for (const item of socialButtons) {
    const obj = item.obj
    try {
      if (obj.updateWorldMatrix) obj.updateWorldMatrix(true, false)
      const Vector3Class = camera.position?.constructor || (window as any).THREE?.Vector3
      if (Vector3Class && camera.project) {
        const worldPos = new Vector3Class()
        if (obj.getWorldPosition) obj.getWorldPosition(worldPos)
        else if (obj.matrixWorld) worldPos.setFromMatrixPosition(obj.matrixWorld)

        const screenPoint = worldPos.clone()
        camera.project(screenPoint)

        if (screenPoint.z > -1 && screenPoint.z < 1) {
          const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left
          const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top
          const dist = Math.hypot(screenX - pixelX, screenY - pixelY)
          if (dist < minDistance) {
            minDistance = dist
            bestMatch = {obj, url: item.url, dist}
          }
        }
      }
    } catch (e) {}
  }

  if (bestMatch && bestMatch.url) {
    console.log(`[open-url-button] Proyección 2D seleccionó: ${bestMatch.url} (${Math.round(bestMatch.dist)}px)`)
    pulseObjectScale(bestMatch.obj)
    navigateToUrl(bestMatch.url)
  }
}

// Registro del comportamiento global
let isGlobalAttached = false
ecs.registerComponent({
  name: 'open-url-global-behavior',
  add: (world) => {
    if (isGlobalAttached) return
    isGlobalAttached = true

    world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (event: any) => {
      if (event?.position) {
        handleGlobalTouch(world, event.position.x, event.position.y, event.target)
      }
    })

    const canvas = (world as any).three?.renderer?.domElement || document.querySelector('canvas') || window
    canvas.addEventListener('touchend', ((e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        handleGlobalTouch(world, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    }) as any, {passive: true})

    canvas.addEventListener('click', ((e: MouseEvent) => {
      handleGlobalTouch(world, e.clientX, e.clientY)
    }) as any)
  },
})

export default OpenUrlButtonComponent


