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
 * Determina la URL exacta según el EID de la entidad, componentes o posición 3D
 */
export function getUrlForEid(world: ecs.World, eid: ecs.Eid): string {
  const eidStr = String(eid).toLowerCase()

  // 1. Por ID directo de entidad de .expanse.json
  if (eidStr.includes('wapp') || eidStr.includes('whats')) return SOCIAL_LINKS.whatsapp
  if (eidStr.includes('insta')) return SOCIAL_LINKS.instagram
  if (eidStr.includes('spoti')) return SOCIAL_LINKS.spotify

  // 2. Por el componente OpenUrlButtonComponent
  try {
    if (OpenUrlButtonComponent && OpenUrlButtonComponent.has(world, eid)) {
      const data: any = OpenUrlButtonComponent.get(world, eid)
      if (data?.url && typeof data.url === 'string' && data.url.startsWith('http')) {
        return data.url
      }
    }
  } catch (e) {}

  // 3. Por el nombre del objeto Three.js
  const threeState = (world as any).three
  const obj = threeState?.entityToObject?.get(eid)
  const objName = (obj?.name || '').toLowerCase()

  if (objName.includes('wapp') || objName.includes('whats') || objName.includes('wa.me')) return SOCIAL_LINKS.whatsapp
  if (objName.includes('insta') || objName.includes('instagram')) return SOCIAL_LINKS.instagram
  if (objName.includes('spoti') || objName.includes('spotify')) return SOCIAL_LINKS.spotify

  // 4. Por la posición local en X dentro del Image Target
  // WhatsApp está a la izquierda (X = -0.24), Instagram en el centro (X = 0), Spotify a la derecha (X = 0.26)
  const posX = obj?.position?.x ?? 0
  if (posX < -0.1) return SOCIAL_LINKS.whatsapp
  if (posX > 0.1) return SOCIAL_LINKS.spotify
  return SOCIAL_LINKS.instagram
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
  // Si el evento viene con un target directo válido
  if (targetEid) {
    const eidStr = String(targetEid).toLowerCase()
    if (eidStr.includes('wapp') || eidStr.includes('insta') || eidStr.includes('spoti')) {
      const directUrl = getUrlForEid(world, targetEid)
      if (directUrl) {
        console.log(`[open-url-button] Target directo ${targetEid} -> ${directUrl}`)
        const obj = (world as any).three?.entityToObject?.get(targetEid)
        if (obj) pulseObjectScale(obj)
        navigateToUrl(directUrl)
        return
      }
    }
  }

  const threeState = (world as any).three
  if (!threeState) return

  const camera = threeState.activeCamera
  const renderer = threeState.renderer
  const canvas = renderer?.domElement || document.querySelector('canvas')
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()
  const entityToObject = threeState.entityToObject as Map<ecs.Eid, any>
  if (!entityToObject) return

  const logoEntries: {eid: ecs.Eid; obj: any; url: string}[] = []

  for (const [eid, obj] of entityToObject.entries()) {
    if (!obj || obj.visible === false) continue

    const objName = (obj.name || '').toLowerCase()
    const eidStr = String(eid).toLowerCase()

    if (
      objName.includes('snoop') ||
      objName.includes('plano') ||
      objName.includes('plane') ||
      objName.includes('camera') ||
      objName.includes('light') ||
      objName === 'button' ||
      objName === 'text' ||
      objName === 'icon'
    ) {
      continue
    }

    if (
      eidStr.includes('wapp') ||
      eidStr.includes('insta') ||
      eidStr.includes('spoti') ||
      objName.includes('whatsapp') ||
      objName.includes('instagram') ||
      objName.includes('spotify') ||
      (OpenUrlButtonComponent && OpenUrlButtonComponent.has(world, eid))
    ) {
      const url = getUrlForEid(world, eid)
      if (url) {
        logoEntries.push({eid, obj, url})
      }
    }
  }

  // 1. Raycaster 3D exacto
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
      const meshToEntryMap = new Map<any, {eid: ecs.Eid; obj: any; url: string}>()

      for (const entry of logoEntries) {
        entry.obj.traverse((child: any) => {
          if (child.isMesh) {
            meshesToTest.push(child)
            meshToEntryMap.set(child, entry)
          }
        })
      }

      const intersects = raycaster.intersectObjects(meshesToTest, false)
      if (intersects && intersects.length > 0) {
        const hitMesh = intersects[0].object
        const matched = meshToEntryMap.get(hitMesh)
        if (matched) {
          console.log(`[open-url-button] Raycast 3D exacto: ${matched.url}`)
          pulseObjectScale(matched.obj)
          navigateToUrl(matched.url)
          return
        }
      }
    }
  } catch (e) {}

  // 2. Proyección 2D en pantalla (Proximidad táctil)
  let closestMatch: {obj: any; url: string; dist: number} | null = null
  let minDistance = 70 // Límite estricto de 70px para evitar cruce de botones cercanos

  for (const entry of logoEntries) {
    const obj = entry.obj
    let objDist = Infinity

    try {
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
          objDist = Math.hypot(screenX - clientX, screenY - clientY)
        }
      }
    } catch (e) {}

    if (objDist < minDistance) {
      minDistance = objDist
      closestMatch = {obj, url: entry.url, dist: objDist}
    }
  }

  if (closestMatch && closestMatch.url) {
    console.log(`[open-url-button] Proximidad 2D detectó: ${closestMatch.url} (${Math.round(closestMatch.dist)}px)`)
    pulseObjectScale(closestMatch.obj)
    navigateToUrl(closestMatch.url)
  }
}

/**
 * Registro de Componente ECS Principal
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
    const handleAction = () => {
      const url = getUrlForEid(world, component.eid)
      console.log(`[open-url-button] Click en entidad ${component.eid} -> URL: ${url}`)
      if (url) {
        const obj = (world as any).three?.entityToObject?.get(component.eid)
        if (obj) pulseObjectScale(obj)
        navigateToUrl(url)
      }
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, handleAction)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, handleAction)
    world.events.addListener(component.eid, 'click', handleAction)
  },
})

// Registro de comportamiento global táctil
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

