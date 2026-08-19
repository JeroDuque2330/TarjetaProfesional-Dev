import * as ecs from '@8thwall/ecs'

/**
 * Enlaces Oficiales de Redes Sociales
 */
export const SOCIAL_LINKS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

let lastUrlOpenTime = 0

/**
 * Abre la URL de forma segura en dispositivos móviles
 */
export function navigateToUrl(url: string) {
  const now = Date.now()
  if (now - lastUrlOpenTime < 500) return
  lastUrlOpenTime = now

  console.log(`[Redirección WebAR] Abriendo enlace: ${url}`)

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
 * Pulso visual en 3D
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
 * Componente Dedicado: WhatsApp
 */
export const OpenWhatsappComponent = ecs.registerComponent({
  name: 'open-whatsapp',
  add: (world, component) => {
    const trigger = () => {
      console.log('[open-whatsapp] ¡Click en WhatsApp detectado!')
      const obj = (world as any).three?.entityToObject?.get(component.eid)
      if (obj) pulseObjectScale(obj)
      navigateToUrl(SOCIAL_LINKS.whatsapp)
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, trigger)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, trigger)
    world.events.addListener(component.eid, 'click', trigger)
  },
})

/**
 * Componente Dedicado: Instagram
 */
export const OpenInstagramComponent = ecs.registerComponent({
  name: 'open-instagram',
  add: (world, component) => {
    const trigger = () => {
      console.log('[open-instagram] ¡Click en Instagram detectado!')
      const obj = (world as any).three?.entityToObject?.get(component.eid)
      if (obj) pulseObjectScale(obj)
      navigateToUrl(SOCIAL_LINKS.instagram)
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, trigger)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, trigger)
    world.events.addListener(component.eid, 'click', trigger)
  },
})

/**
 * Componente Dedicado: Spotify
 */
export const OpenSpotifyComponent = ecs.registerComponent({
  name: 'open-spotify',
  add: (world, component) => {
    const trigger = () => {
      console.log('[open-spotify] ¡Click en Spotify detectado!')
      const obj = (world as any).three?.entityToObject?.get(component.eid)
      if (obj) pulseObjectScale(obj)
      navigateToUrl(SOCIAL_LINKS.spotify)
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, trigger)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, trigger)
    world.events.addListener(component.eid, 'click', trigger)
  },
})

/**
 * Componente Genérico con parámetro de URL
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
    const trigger = () => {
      let targetUrl = ''
      try {
        if (OpenUrlButtonComponent.has(world, component.eid)) {
          const data: any = OpenUrlButtonComponent.get(world, component.eid)
          targetUrl = data?.url || ''
        }
      } catch (e) {}

      if (!targetUrl) {
        targetUrl = (component as any).data?.url || ''
      }

      if (targetUrl) {
        const obj = (world as any).three?.entityToObject?.get(component.eid)
        if (obj) pulseObjectScale(obj)
        navigateToUrl(targetUrl)
      }
    }

    world.events.addListener(component.eid, ecs.input.UI_CLICK, trigger)
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, trigger)
    world.events.addListener(component.eid, 'click', trigger)
  },
})

/**
 * Raycaster 3D global para detectar toques en la tarjeta
 */
function handleTargetRaycast(world: ecs.World, rawX: number, rawY: number) {
  const threeState = (world as any).three
  if (!threeState) return

  const camera = threeState.activeCamera
  const renderer = threeState.renderer
  const canvas = renderer?.domElement || document.querySelector('canvas')
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()

  // Normalizar coordenadas táctiles (-1 a 1)
  let normX = 0
  let normY = 0

  if (rawX <= 1.0 && rawY <= 1.0 && rawX >= 0 && rawY >= 0) {
    normX = rawX * 2 - 1
    normY = -(rawY * 2 - 1)
  } else {
    normX = ((rawX - canvasRect.left) / canvasRect.width) * 2 - 1
    normY = -((rawY - canvasRect.top) / canvasRect.height) * 2 + 1
  }

  try {
    const THREE = (window as any).THREE || camera.constructor?.prototype ? (camera as any).constructor : null
    const RaycasterCtor = THREE?.Raycaster || (window as any).THREE?.Raycaster || (camera as any).raycaster?.constructor
    if (!RaycasterCtor) return

    const raycaster = new RaycasterCtor()
    raycaster.setFromCamera({x: normX, y: normY}, camera)

    // Buscar el Image Target en Three.js
    const entityToObject = threeState.entityToObject as Map<ecs.Eid, any>
    if (!entityToObject) return

    const targetMeshes: any[] = []
    let targetRoot: any = null

    for (const [eid, obj] of entityToObject.entries()) {
      if (!obj) continue
      if (ecs.ImageTarget && ecs.ImageTarget.has(world, eid)) {
        targetRoot = obj
      }
      obj.traverse((child: any) => {
        if (child.isMesh) {
          const n = (child.name || '').toLowerCase()
          if (!n.includes('snoop') && !n.includes('plano') && !n.includes('plane') && !n.includes('button') && !n.includes('text')) {
            targetMeshes.push(child)
          }
        }
      })
    }

    if (targetMeshes.length === 0) return

    const intersects = raycaster.intersectObjects(targetMeshes, true)
    if (intersects && intersects.length > 0) {
      const hit = intersects[0]
      const hitPoint = hit.point

      // Transformar el punto de impacto al sistema de coordenadas local del Image Target
      if (targetRoot && targetRoot.worldToLocal) {
        const localPoint = hitPoint.clone()
        targetRoot.worldToLocal(localPoint)

        // En la fila inferior de la tarjeta:
        // WhatsApp está a la izquierda (X < -0.06)
        // Instagram está en el centro (-0.06 <= X <= 0.06)
        // Spotify está a la derecha (X > 0.06)
        if (localPoint.y < -0.1) {
          if (localPoint.x < -0.06) {
            console.log(`[Raycast Target] WhatsApp detectado en X: ${localPoint.x.toFixed(3)}`)
            navigateToUrl(SOCIAL_LINKS.whatsapp)
            return
          } else if (localPoint.x > 0.06) {
            console.log(`[Raycast Target] Spotify detectado en X: ${localPoint.x.toFixed(3)}`)
            navigateToUrl(SOCIAL_LINKS.spotify)
            return
          } else {
            console.log(`[Raycast Target] Instagram detectado en X: ${localPoint.x.toFixed(3)}`)
            navigateToUrl(SOCIAL_LINKS.instagram)
            return
          }
        }
      }
    }
  } catch (e) {}
}

/**
 * Comportamiento global de respaldo
 */
let isGlobalAttached = false
ecs.registerComponent({
  name: 'open-url-global-behavior',
  add: (world) => {
    if (isGlobalAttached) return
    isGlobalAttached = true

    world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (event: any) => {
      if (event?.position) {
        handleTargetRaycast(world, event.position.x, event.position.y)
      }
    })

    const canvas = (world as any).three?.renderer?.domElement || document.querySelector('canvas') || window
    canvas.addEventListener('touchend', ((e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        handleTargetRaycast(world, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    }) as any, {passive: true})

    canvas.addEventListener('click', ((e: MouseEvent) => {
      handleTargetRaycast(world, e.clientX, e.clientY)
    }) as any)
  },
})

export default OpenUrlButtonComponent

