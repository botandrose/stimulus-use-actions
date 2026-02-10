function useActionsImpl(controller, actions) {
  // Allow calling without explicit map: read from static/class property
  if (!actions) actions = controller?.constructor?.actions || controller?.actions;
  if (!actions || typeof actions !== "object") return;
  const bindingObserver = controller.context.bindingObserver

  Object.entries(actions).forEach(([targetName, actionName]) => {
    let elements = controller[targetName]
    if(!targetName.endsWith("Targets")) elements = [elements]
    if(targetName === "window") elements = [controller.element]
    elements.forEach((element, index) => {
      const actionNames = Array.isArray(actionName) ? actionName : [actionName]
      actionNames.forEach(actionName => {
        const content = buildActionString(controller, targetName, actionName)
        const action = bindingObserver.parseValueForToken({ element, index, content })
        bindingObserver.connectAction(action)
      })
    })
  })

  function buildActionString(controller, targetName, actionName) {
    let eventPrefix = ''
    let target = targetName === "window" ? "@window" : ''
    const result = actionName.match(/^(.+)(->)(.+)$/)
    if(result) {
      eventPrefix = result[1]
      actionName = result[3]
    }
    let arrow = eventPrefix.length + target.length > 0 ? '->' : ''
    return `${eventPrefix}${target}${arrow}${controller.identifier}#${actionName}`
  }
}

export default useActionsImpl

// Helper to wrap a Stimulus Controller class so actions bind automatically
export function withActions(BaseController) {
  return class WithActions extends BaseController {
    connect() {
      super.connect()
      // Bind actions declared on the class via `static actions = {}`
      // Call with only controller; it will resolve static actions
      useActionsImpl(this)
    }
  }
}
import { Controller as StimulusController } from "@hotwired/stimulus"

// Base Controller that auto-binds actions declared via `static actions = {}`
export class Controller extends StimulusController {
  connect() {
    super.connect()
    useActionsImpl(this)
  }
}
