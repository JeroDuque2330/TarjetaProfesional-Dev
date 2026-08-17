import * as ecs from '@8thwall/ecs'

// URLs de redes sociales de Jerónimo Duque
export const SOCIAL_URLS = {
  whatsapp: 'https://wa.me/573154445000',
  instagram: 'https://www.instagram.com/jeronimoduque423/',
  spotify: 'https://open.spotify.com/user/o0gt0327bv62udbgzyjh0qomt?si=076634e60fe84ede',
}

let isSocialInitialized = false

// Comportamiento automático que vincula clics a las redes sociales
ecs.registerBehavior((world) => {
  if (isSocialInitialized) return

  let count = 0

  for (const eid of world.allEntities) {
    const threeObj = world.three && world.three.entityToObject ? world.three.entityToObject.get(eid) : null
    const name = threeObj && threeObj.name ? threeObj.name.toLowerCase() : ''
    const strEid = String(eid).toLowerCase()

    if (name.includes('whatsapp') || strEid.includes('wapp')) {
      count++
      world.events.addListener(eid, 'click', () => {
        console.log('[social-links] Abriendo WhatsApp:', SOCIAL_URLS.whatsapp)
        window.open(SOCIAL_URLS.whatsapp, '_blank')
      })
    } else if (name.includes('instagram') || strEid.includes('insta')) {
      count++
      world.events.addListener(eid, 'click', () => {
        console.log('[social-links] Abriendo Instagram:', SOCIAL_URLS.instagram)
        window.open(SOCIAL_URLS.instagram, '_blank')
      })
    } else if (name.includes('spotify') || strEid.includes('spoti')) {
      count++
      world.events.addListener(eid, 'click', () => {
        console.log('[social-links] Abriendo Spotify:', SOCIAL_URLS.spotify)
        window.open(SOCIAL_URLS.spotify, '_blank')
      })
    }
  }

  if (count >= 3) {
    isSocialInitialized = true
  }
})

// Componente asignable individualmente
ecs.registerComponent({
  name: 'open-url-on-click',
  schema: {
    url: ecs.string,
  },
  add: (world, component) => {
    const openLink = () => {
      const targetUrl = component.schema.url
      if (targetUrl) {
        console.log('[open-url-on-click] Abriendo URL:', targetUrl)
        window.open(targetUrl, '_blank')
      }
    }

    world.events.addListener(component.eid, 'click', openLink)
  },
})
