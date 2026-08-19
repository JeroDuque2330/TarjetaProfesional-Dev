import * as ecs from '@8thwall/ecs'
import {toggleVideo} from './video-toggle-button'

/**
 * VideoControlComponent.ts
 * Registra el componente VideoControlComponent requerido por 8th Wall ECS.
 */

const VideoControlComponent = ecs.registerComponent({
  name: 'VideoControlComponent',
  schema: {
    targetName: ecs.string,
    videoSrc: ecs.string,
  },
  schemaDefaults: {
    targetName: 'TarjetaProfesional',
    videoSrc: 'assets/Penta_Tristana_1.mp4',
  },
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
      toggleVideo(world)
    })
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
      toggleVideo(world)
    })
    world.events.addListener(component.eid, 'click', () => {
      toggleVideo(world)
    })
  },
})

export default VideoControlComponent
