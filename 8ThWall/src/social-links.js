import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'open-url-on-click',
  schema: {
    url: ecs.string,
  },
  add: (world, component) => {
    const openLink = () => {
      const targetUrl = component.schema.url
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      }
    }

    world.events.addListener(component.eid, 'click', openLink)
  },
})
