import * as ecs from '@8thwall/ecs'

let isInitialized = false

// Conexión automática que espera a que las entidades estén listas en la escena
ecs.registerBehavior((world) => {
  if (isInitialized) return

  let buttonEid = null
  let videoEid = null

  for (const eid of world.allEntities) {
    if (!videoEid && ecs.VideoControls.has(world, eid)) {
      videoEid = eid
    }
    if (!buttonEid && ecs.Ui.has(world, eid)) {
      buttonEid = eid
    }
  }

  if (buttonEid && videoEid) {
    isInitialized = true

    const toggleVideo = () => {
      const controls = ecs.VideoControls.get(world, videoEid)
      const isPaused = controls ? controls.paused : false

      ecs.VideoControls.set(world, videoEid, {
        paused: !isPaused,
      })
    }

    // En 8th Wall ECS el evento de clic en UI es 'click' o ecs.input.UI_CLICK
    world.events.addListener(buttonEid, 'click', toggleVideo)
  }
})

// Componente registrado para 8th Wall Studio
ecs.registerComponent({
  name: 'video-toggle',
  schema: {
    videoTarget: ecs.eid,
  },
  add: (world, component) => {
    const toggleVideo = () => {
      let targetEid = component.schema.videoTarget
      if (typeof targetEid === 'object' && targetEid !== null && targetEid.id) {
        targetEid = targetEid.id
      }

      if (!targetEid) {
        for (const eid of world.allEntities) {
          if (ecs.VideoControls.has(world, eid)) {
            targetEid = eid
            break
          }
        }
      }

      if (!targetEid) return

      const controls = ecs.VideoControls.get(world, targetEid)
      const isPaused = controls ? controls.paused : false

      ecs.VideoControls.set(world, targetEid, {
        paused: !isPaused,
      })
    }

    world.events.addListener(component.eid, 'click', toggleVideo)
  },
})
