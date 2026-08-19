import * as ecs from '@8thwall/ecs'

const SOCIAL_URLS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

const attachedEntities = new Set()

ecs.registerBehavior((world) => {
  for (const eid of world.allEntities) {
    if (attachedEntities.has(eid)) continue

    // 1. Personaje 3D (Snoop GLTF) -> Cambiar animación al hacer clic
    if (ecs.GltfModel.has(world, eid)) {
      attachedEntities.add(eid)
      const clips = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
      let animIndex = 0

      console.log('[8thWall Interaction] Personaje GLTF Snoop vinculado:', eid)

      world.events.addListener(eid, 'click', () => {
        animIndex = (animIndex + 1) % clips.length
        const nextClip = clips[animIndex]
        console.log('[8thWall Interaction] Cambiando animación a:', nextClip)
        ecs.GltfModel.mutate(world, eid, (cursor) => {
          cursor.animationClip = nextClip
        })
      })
      continue
    }

    // 2. Elementos UI 3D (Botón de Video y Botones de Redes Sociales)
    if (ecs.Ui.has(world, eid)) {
      const parentEid = world.getParent ? world.getParent(eid) : null

      // Botón de Video (hijo del Plano de Video)
      if (parentEid && ecs.VideoControls.has(world, parentEid)) {
        attachedEntities.add(eid)
        console.log('[8thWall Interaction] Botón de Video vinculado:', eid)

        world.events.addListener(eid, 'click', () => {
          const controls = ecs.VideoControls.get(world, parentEid)
          const isPaused = controls ? controls.paused : false
          console.log('[8thWall Interaction] Alternando reproducción de video (pausa =', !isPaused, ')')
          ecs.VideoControls.set(world, parentEid, { paused: !isPaused })
        })
        continue
      }

      // Buscar el nombre navegando hacia arriba en la jerarquía de Three.js
      let threeObj = world.three && world.three.entityToObject ? world.three.entityToObject.get(eid) : null
      let entityName = ''

      let currentObj = threeObj
      while (currentObj) {
        if (currentObj.name) {
          const n = currentObj.name.toLowerCase()
          if (n.includes('whatsapp') || n.includes('wapp')) { entityName = 'whatsapp'; break }
          if (n.includes('instagram') || n.includes('insta')) { entityName = 'instagram'; break }
          if (n.includes('spotify') || n.includes('spoti')) { entityName = 'spotify'; break }
        }
        currentObj = currentObj.parent
      }

      if (entityName === 'whatsapp') {
        attachedEntities.add(eid)
        console.log('[8thWall Interaction] WhatsApp vinculado:', eid)
        world.events.addListener(eid, 'click', () => {
          console.log('[8thWall Interaction] Abriendo WhatsApp')
          window.open(SOCIAL_URLS.whatsapp, '_blank')
        })
      } else if (entityName === 'instagram') {
        attachedEntities.add(eid)
        console.log('[8thWall Interaction] Instagram vinculado:', eid)
        world.events.addListener(eid, 'click', () => {
          console.log('[8thWall Interaction] Abriendo Instagram')
          window.open(SOCIAL_URLS.instagram, '_blank')
        })
      } else if (entityName === 'spotify') {
        attachedEntities.add(eid)
        console.log('[8thWall Interaction] Spotify vinculado:', eid)
        world.events.addListener(eid, 'click', () => {
          console.log('[8thWall Interaction] Abriendo Spotify')
          window.open(SOCIAL_URLS.spotify, '_blank')
        })
      }
    }
  }
})
