import * as ecs from '@8thwall/ecs'
import {toggleCharacterAnimation} from './character-animation-toggle'

/**
 * AvatarAnimationComponent.ts
 * Registra el componente AvatarAnimationComponent con los clips de animación de Jerónimo.
 */

const AvatarAnimationComponent = ecs.registerComponent({
  name: 'AvatarAnimationComponent',
  schema: {
    clip1: ecs.string,
    clip2: ecs.string,
  },
  schemaDefaults: {
    clip1: 'Bailecito Hip Hop',
    clip2: 'Bailecito Tranquilito',
  },
  add: (world, component) => {
    world.events.addListener(component.eid, ecs.input.SCREEN_TOUCH_START, () => {
      toggleCharacterAnimation(world, component.eid)
    })
    world.events.addListener(component.eid, ecs.input.UI_CLICK, () => {
      toggleCharacterAnimation(world, component.eid)
    })
    world.events.addListener(component.eid, 'click', () => {
      toggleCharacterAnimation(world, component.eid)
    })
  },
})

export default AvatarAnimationComponent
