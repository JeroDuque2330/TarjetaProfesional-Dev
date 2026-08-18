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

    const threeObj = world.three && world.three.entityToObject ? world.three.entityToObject.get(eid) : null
    const name = threeObj && threeObj.name ? threeObj.name.toLowerCase() : ''

    // 1. Personaje Snoop: Cambiar animaciones al tocarlo
    if (name.includes('snoop') || (ecs.GltfModel.has(world, eid) && name === '')) {
      attachedEntities.add(eid)
      const clips = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
      let animIndex = 0

      console.log('[8thWall Interaction] Personaje Snoop vinculado:', eid)

      const onCharClick = () => {
        animIndex = (animIndex + 1) % clips.length
        const nextClip = clips[animIndex]
        console.log('[8thWall Interaction] Cambiando animación de Snoop a:', nextClip)
        ecs.GltfModel.mutate(world, eid, (cursor) => {
          cursor.animationClip = nextClip
        })
      }

      world.events.addListener(eid, 'click', onCharClick)
    }

    // 2. WhatsApp: Abrir enlace al tocar
    if (name.includes('whatsapp') || name.includes('wapp')) {
      attachedEntities.add(eid)
      console.log('[8thWall Interaction] Botón WhatsApp vinculado:', eid)
      world.events.addListener(eid, 'click', () => {
        console.log('[8thWall Interaction] Abriendo WhatsApp')
        window.open(SOCIAL_URLS.whatsapp, '_blank')
      })
    }

    // 3. Instagram: Abrir enlace al tocar
    if (name.includes('instagram') || name.includes('insta')) {
      attachedEntities.add(eid)
      console.log('[8thWall Interaction] Botón Instagram vinculado:', eid)
      world.events.addListener(eid, 'click', () => {
        console.log('[8thWall Interaction] Abriendo Instagram')
        window.open(SOCIAL_URLS.instagram, '_blank')
      })
    }

    // 4. Spotify: Abrir enlace al tocar
    if (name.includes('spotify') || name.includes('spoti')) {
      attachedEntities.add(eid)
      console.log('[8thWall Interaction] Botón Spotify vinculado:', eid)
      world.events.addListener(eid, 'click', () => {
        console.log('[8thWall Interaction] Abriendo Spotify')
        window.open(SOCIAL_URLS.spotify, '_blank')
      })
    }

    // 5. Botón de Video: Reproducir / Pausar el video
    if (name === 'button' || (name.includes('button') && !name.includes('wapp') && !name.includes('insta') && !name.includes('spoti'))) {
      attachedEntities.add(eid)
      console.log('[8thWall Interaction] Botón de Video vinculado:', eid)

      const onVideoBtnClick = () => {
        for (const vEid of world.allEntities) {
          if (ecs.VideoControls.has(world, vEid)) {
            const controls = ecs.VideoControls.get(world, vEid)
            const isPaused = controls ? controls.paused : false
            console.log('[8thWall Interaction] Alternando estado de video (pausa =', !isPaused, ')')
            ecs.VideoControls.set(world, vEid, { paused: !isPaused })
            break
          }
        }
      }

      world.events.addListener(eid, 'click', onVideoBtnClick)
    }
  }
})
