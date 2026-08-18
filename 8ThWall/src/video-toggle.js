import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'video-toggle',
  schema: {
    videoTarget: ecs.eid,
  },
  add: (world, component) => {
    const toggleVideo = () => {
      let targetEid = component.schema.videoTarget
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
      ecs.VideoControls.set(world, targetEid, { paused: !isPaused })
    }

    world.events.addListener(component.eid, 'click', toggleVideo)
  },
})
