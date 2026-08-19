import * as ecs from '@8thwall/ecs'

const SOCIAL_URLS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

// 1. Componente para alternar animación de Snoop
const CharacterToggle = ecs.registerComponent({
  name: 'character-toggle',
  add: (world, component) => {
    const clips = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
    let index = 0

    console.log('[8thWall Component] Snoop vinculado para toque.')

    const toggle = () => {
      index = (index + 1) % clips.length
      const nextClip = clips[index]
      console.log('[8thWall Component] Cambiando animación a:', nextClip)
      ecs.GltfModel.mutate(world, component.eid, (c) => {
        c.animationClip = nextClip
      })
    }

    world.events.addListener(component.eid, 'click', toggle)
  },
})

// 2. Componente para reproductor de video
const VideoButton = ecs.registerComponent({
  name: 'video-button',
  add: (world, component) => {
    console.log('[8thWall Component] Botón de Video vinculado.')

    const toggleVideo = () => {
      for (const vEid of world.allEntities) {
        if (ecs.VideoControls.has(world, vEid)) {
          const controls = ecs.VideoControls.get(world, vEid)
          const isPaused = controls ? controls.paused : false
          console.log('[8thWall Component] Video alternando pausa =', !isPaused)
          ecs.VideoControls.set(world, vEid, { paused: !isPaused })
          break
        }
      }
    }

    world.events.addListener(component.eid, 'click', toggleVideo)
  },
})

// 3. Componentes para enlaces de redes sociales
const OpenWhatsapp = ecs.registerComponent({
  name: 'open-whatsapp',
  add: (world, component) => {
    console.log('[8thWall Component] WhatsApp vinculado.')
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo WhatsApp')
      window.open(SOCIAL_URLS.whatsapp, '_blank')
    })
  },
})

const OpenInstagram = ecs.registerComponent({
  name: 'open-instagram',
  add: (world, component) => {
    console.log('[8thWall Component] Instagram vinculado.')
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo Instagram')
      window.open(SOCIAL_URLS.instagram, '_blank')
    })
  },
})

const OpenSpotify = ecs.registerComponent({
  name: 'open-spotify',
  add: (world, component) => {
    console.log('[8thWall Component] Spotify vinculado.')
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo Spotify')
      window.open(SOCIAL_URLS.spotify, '_blank')
    })
  },
})

// Behavior global que asigna automáticamente los componentes a cada entidad
ecs.registerBehavior((world) => {
  for (const eid of world.allEntities) {
    // Snoop GLTF Model
    if (ecs.GltfModel.has(world, eid) && !CharacterToggle.has(world, eid)) {
      CharacterToggle.set(world, eid, {})
    }

    // Botón de Video (hijo del Plano)
    const parentEid = world.getParent ? world.getParent(eid) : null
    if (parentEid && ecs.VideoControls.has(world, parentEid) && !VideoButton.has(world, eid)) {
      VideoButton.set(world, eid, {})
    }

    // Redes Sociales por nombre de entidad Three.js
    const threeObj = world.three && world.three.entityToObject ? world.three.entityToObject.get(eid) : null
    if (threeObj && threeObj.name) {
      const n = threeObj.name.toLowerCase()
      if ((n.includes('whatsapp') || n.includes('wapp')) && !OpenWhatsapp.has(world, eid)) {
        OpenWhatsapp.set(world, eid, {})
      } else if ((n.includes('instagram') || n.includes('insta')) && !OpenInstagram.has(world, eid)) {
        OpenInstagram.set(world, eid, {})
      } else if ((n.includes('spotify') || n.includes('spoti')) && !OpenSpotify.has(world, eid)) {
        OpenSpotify.set(world, eid, {})
      }
    }
  }
})
