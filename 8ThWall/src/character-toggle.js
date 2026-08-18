import * as ecs from '@8thwall/ecs'

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
