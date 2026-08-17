import * as ecs from '@8thwall/ecs'

let isCharacterInitialized = false

// Conexión automática para cambiar la animación de Snoop al tocarlo
ecs.registerBehavior((world) => {
  if (isCharacterInitialized) return

  let characterEid = null

  // Buscar la entidad del personaje GLTF
  for (const eid of world.allEntities) {
    if (ecs.GltfModel.has(world, eid)) {
      characterEid = eid
      break
    }
  }

  if (characterEid) {
    isCharacterInitialized = true

    // Las 2 animaciones incluidas en Snoop_Final.glb
    const animations = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
    let animIndex = 0

    const toggleAnimation = () => {
      animIndex = (animIndex + 1) % animations.length
      const newClip = animations[animIndex]

      console.log(`[character-toggle] Cambiando animación a: ${newClip}`)

      ecs.GltfModel.mutate(world, characterEid, (cursor) => {
        cursor.animationClip = newClip
      })
    }

    world.events.addListener(characterEid, 'click', toggleAnimation)
  }
})

// Componente registrado para 8th Wall Studio (opcional)
ecs.registerComponent({
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
    let animIndex = 0
    const toggleAnimation = () => {
      const clips = [
        component.schema.clip1 || 'Bailecito Hip Hop',
        component.schema.clip2 || 'Bailecito Tranquilito',
      ]
      animIndex = (animIndex + 1) % clips.length
      const newClip = clips[animIndex]

      ecs.GltfModel.mutate(world, component.eid, (cursor) => {
        cursor.animationClip = newClip
      })
    }

    world.events.addListener(component.eid, 'click', toggleAnimation)
  },
})
