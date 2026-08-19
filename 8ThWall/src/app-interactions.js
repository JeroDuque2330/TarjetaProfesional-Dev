import * as ecs from '@8thwall/ecs'

const SOCIAL_URLS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

// 1. Componente para cambiar animaciones del personaje Snoop al tocarlo
ecs.registerComponent({
  name: 'character-toggle',
  add: (world, component) => {
    const clips = ['Bailecito Hip Hop', 'Bailecito Tranquilito']
    let index = 0

    console.log('[8thWall Component] character-toggle inicializado para eid:', component.eid)

    const toggle = () => {
      index = (index + 1) % clips.length
      const nextClip = clips[index]
      console.log('[8thWall Component] Snoop cambiando animación a:', nextClip)
      ecs.GltfModel.mutate(world, component.eid, (c) => {
        c.animationClip = nextClip
      })
    }

    world.events.addListener(component.eid, 'click', toggle)
  },
})

// 2. Componente para reproducir / pausar el video
ecs.registerComponent({
  name: 'video-button',
  add: (world, component) => {
    console.log('[8thWall Component] video-button inicializado para eid:', component.eid)

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

// 3. Componentes para redes sociales
ecs.registerComponent({
  name: 'open-whatsapp',
  add: (world, component) => {
    console.log('[8thWall Component] open-whatsapp inicializado para eid:', component.eid)
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo WhatsApp')
      window.open(SOCIAL_URLS.whatsapp, '_blank')
    })
  },
})

ecs.registerComponent({
  name: 'open-instagram',
  add: (world, component) => {
    console.log('[8thWall Component] open-instagram inicializado para eid:', component.eid)
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo Instagram')
      window.open(SOCIAL_URLS.instagram, '_blank')
    })
  },
})

ecs.registerComponent({
  name: 'open-spotify',
  add: (world, component) => {
    console.log('[8thWall Component] open-spotify inicializado para eid:', component.eid)
    world.events.addListener(component.eid, 'click', () => {
      console.log('[8thWall Component] Abriendo Spotify')
      window.open(SOCIAL_URLS.spotify, '_blank')
    })
  },
})
