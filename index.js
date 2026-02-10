import { Controller as StimulusController } from "@hotwired/stimulus"

// --- Direct binding via Stimulus internals (useActions, withActions) ---

function useActionsImpl(controller, actions) {
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

export function withActions(BaseController) {
  return class WithActions extends BaseController {
    connect() {
      super.connect()
      useActionsImpl(this)
    }
  }
}

// --- Delegated binding (Controller) ---

const KEY_MAP = {
  enter: "Enter",
  tab: "Tab",
  esc: "Escape",
  space: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
}

function parseDescriptor(descriptor) {
  const arrowIndex = descriptor.indexOf("->")
  if (arrowIndex === -1) return null
  const eventPart = descriptor.substring(0, arrowIndex)
  const methodPart = descriptor.substring(arrowIndex + 2)
  const dotIndex = eventPart.indexOf(".")
  let eventName, filter
  if (dotIndex === -1) {
    eventName = eventPart
    filter = null
  } else {
    eventName = eventPart.substring(0, dotIndex)
    filter = eventPart.substring(dotIndex + 1)
  }
  const parts = methodPart.split(":")
  const methodName = parts[0]
  const options = parts.slice(1)
  return { eventName, filter, methodName, options }
}

function bindDelegatedActions(controller) {
  const actions = controller.constructor.actions
  if (!actions || typeof actions !== "object") return []
  const identifier = controller.identifier
  const listeners = []

  Object.entries(actions).forEach(([key, descriptors]) => {
    const descriptorList = Array.isArray(descriptors) ? descriptors : [descriptors]
    const isWindow = key === "window"
    let targetName
    if (!isWindow) {
      if (key.endsWith("Targets")) targetName = key.slice(0, -7)
      else if (key.endsWith("Target")) targetName = key.slice(0, -6)
      else targetName = key
    }

    descriptorList.forEach(descriptor => {
      const parsed = parseDescriptor(descriptor)
      if (!parsed) return
      const { eventName, filter, methodName, options } = parsed

      if (isWindow) {
        const handler = (event) => {
          if (filter && event.key !== (KEY_MAP[filter] || filter)) return
          if (options.includes("stop")) event.stopPropagation()
          if (options.includes("prevent")) event.preventDefault()
          controller[methodName](event)
        }
        window.addEventListener(eventName, handler)
        listeners.push({ target: window, eventName, handler })
      } else {
        const selector = `[data-${identifier}-target~="${targetName}"]`
        const handler = (event) => {
          const matched = event.target.closest(selector)
          if (!matched || !controller.element.contains(matched)) return
          if (filter && event.key !== (KEY_MAP[filter] || filter)) return
          if (options.includes("self") && event.target !== matched) return
          if (options.includes("stop")) event.stopPropagation()
          if (options.includes("prevent")) event.preventDefault()
          controller[methodName](event)
        }
        controller.element.addEventListener(eventName, handler)
        listeners.push({ target: controller.element, eventName, handler })
      }
    })
  })

  return listeners
}

function unbindDelegatedActions(listeners) {
  listeners.forEach(({ target, eventName, handler }) => {
    target.removeEventListener(eventName, handler)
  })
}

export class Controller extends StimulusController {
  connect() {
    super.connect()
    this._useActionListeners = bindDelegatedActions(this)
  }
  disconnect() {
    super.disconnect()
    unbindDelegatedActions(this._useActionListeners)
    this._useActionListeners = []
  }
}
