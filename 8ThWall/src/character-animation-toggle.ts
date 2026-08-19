import * as ecs from '@8thwall/ecs'

/**
 * character-animation-toggle.ts
 * Alterna animaciones de Snoop ('Snoop_Final.glb') al tocarlo en WebAR.
 * - Detecta toques directos (targetEid), Raycast 3D de Three.js y proyección de proximidad táctil 2D.
 * - Alterna cíclicamente entre 'Bailecito Hip Hop' y 'Bailecito Tranquilito'.
 */

let lastAvatarToggleTime = 0

const CLIPS = [
  'Bailecito Hip Hop',
  'Bailecito Tranquilito',
]
let currentClipIndex = 0

export function toggleCharacterAnimation(world: ecs.World, eid?: ecs.Eid) {
  const now = Date.now()
  if (now - lastAvatarToggleTime < 450) return
  lastAvatarToggleTime = now

  currentClipIndex = (currentClipIndex + 1) % CLIPS.length
  const nextClip = CLIPS[currentClipIndex]

  console.log(`[character-animation-toggle] Cambiando animación de Snoop a: ${nextClip}`)

  let targetEid = eid
  if (!targetEid) {
    for (const id of world.allEntities) {
      if (ecs.GltfModel && ecs.GltfModel.has(world, id)) {
        targetEid = id
        break
      }
    }
  }

  if (targetEid && ecs.GltfModel && ecs.GltfModel.has(world, targetEid)) {
    try {
      ecs.GltfModel.mutate(world, targetEid, (cursor: any) => {
        cursor.animationClip = nextClip
        cursor.loop = true
        cursor.paused = false
      })
    } catch (err) {
      console.error('[character-animation-toggle] Error al mutar animación:', err)
    }
  }
}

const CharacterAnimationToggleComponent = ecs.registerComponent({
  name: 'character-animation-toggle',
  schema: {
    clip1: ecs.string,
    clip2: ecs.string,
  },
  schemaDefaults: {
    clip1: 'Bailecito Hip Hop',
    clip2: 'Bailecito Tranquilito',
  },
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
      toggleCharacterAnimation(world, component.eid)
    })
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
      toggleCharacterAnimation(world, component.eid)
    })
    world.events.addListener(component.eid, 'click', () => {
      toggleCharacterAnimation(world, component.eid)
    })
  },
})

// Compatibilidad con el nombre character-toggle
try {
  ecs.registerComponent({
    name: 'character-toggle',
    add: (world, component) => {
      world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
        toggleCharacterAnimation(world, component.eid)
      })
      world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
        toggleCharacterAnimation(world, component.eid)
      })
      world.events.addListener(component.eid, 'click', () => {
        toggleCharacterAnimation(world, component.eid)
      })
    },
  })
} catch (e) {}

let isCharGlobalAttached = false
ecs.registerComponent({
  name: 'character-animation-global-behavior',
  add: (world) => {
    if (isCharGlobalAttached) return
    isCharGlobalAttached = true

    const findAvatarEid = (): ecs.Eid | null => {
      const threeState = (world as any).three
      if (!threeState?.entityToObject) return null

      for (const [eid, obj] of threeState.entityToObject.entries()) {
        let gltfSrc = ''
        try {
          if (ecs.GltfModel && ecs.GltfModel.has(world, eid)) {
            const cursor: any = ecs.GltfModel.get(world, eid)
            gltfSrc = cursor.src || cursor.url || ''
          }
        } catch (e) {}

        const objName = (obj?.name || '').toLowerCase()
        const fullId = `${objName} ${gltfSrc}`.toLowerCase()
        if (fullId.includes('snoop') || (ecs.GltfModel && ecs.GltfModel.has(world, eid))) {
          return eid
        }
      }
      return null
    }

    const checkAvatarRaycast = (clientX: number, clientY: number, targetEid?: ecs.Eid) => {
      const avatarEid = findAvatarEid()
      if (!avatarEid) return

      if (targetEid === avatarEid) {
        toggleCharacterAnimation(world, avatarEid)
        return
      }

      const threeState = (world as any).three
      if (!threeState) return
      const avatarObj = threeState.entityToObject?.get(avatarEid)
      const camera = threeState.activeCamera
      const canvas = threeState.renderer?.domElement || document.querySelector('canvas')
      if (!avatarObj || !camera || !canvas || avatarObj.visible === false) return

      const canvasRect = canvas.getBoundingClientRect()

      // 1. Raycast 3D directo con Three.js
      try {
        const THREE = (window as any).THREE || camera.constructor?.prototype ? (camera as any).constructor : null
        const RaycasterCtor = (window as any).THREE?.Raycaster || (camera as any).raycaster?.constructor
        if (RaycasterCtor) {
          const raycaster = new RaycasterCtor()
          const mouse = {
            x: ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
            y: -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1,
          }
          raycaster.setFromCamera(mouse, camera)

          const meshes: any[] = []
          avatarObj.traverse((child: any) => {
            if (child.isMesh) meshes.push(child)
          })

          const intersects = raycaster.intersectObjects(meshes, false)
          if (intersects && intersects.length > 0) {
            console.log('[character-animation-toggle] Raycast 3D impactó en Snoop.')
            toggleCharacterAnimation(world, avatarEid)
            return
          }
        }
      } catch (rayErr) {}

      // 2. Proyección 2D en pantalla (Fallback por proximidad en torso/cabeza)
      let minDistance = Infinity
      try {
        const Vector3Class = camera.position?.constructor
        if (Vector3Class && camera.project) {
          const worldPos = new Vector3Class()
          if (avatarObj.getWorldPosition) avatarObj.getWorldPosition(worldPos)
          else if (avatarObj.matrixWorld) worldPos.setFromMatrixPosition(avatarObj.matrixWorld)

          const points = [
            worldPos.clone(),
            worldPos.clone().add(new Vector3Class(0, 0.25, 0)),
            worldPos.clone().add(new Vector3Class(0, 0.5, 0)),
          ]

          for (const pt of points) {
            camera.project(pt)
            if (pt.z > -1 && pt.z < 1) {
              const screenX = ((pt.x + 1) / 2) * canvasRect.width + canvasRect.left
              const screenY = ((-pt.y + 1) / 2) * canvasRect.height + canvasRect.top
              const dist = Math.hypot(screenX - clientX, screenY - clientY)
              if (dist < minDistance) minDistance = dist
            }
          }
        }
      } catch (e) {}

      if (minDistance <= 130) {
        console.log(`[character-animation-toggle] Proximidad 2D impactó en Snoop (${Math.round(minDistance)}px)`)
        toggleCharacterAnimation(world, avatarEid)
      }
    }

    world.events.addListener(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (event: any) => {
      if (event?.position) {
        checkAvatarRaycast(event.position.x, event.position.y, event.target)
      }
    })

    const canvas = (world as any).three?.renderer?.domElement || document.querySelector('canvas') || window
    canvas.addEventListener('touchend', ((e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        checkAvatarRaycast(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    }) as any, {passive: true})

    canvas.addEventListener('click', ((e: MouseEvent) => {
      checkAvatarRaycast(e.clientX, e.clientY)
    }) as any)
  },
})

export default CharacterAnimationToggleComponent
