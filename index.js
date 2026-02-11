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

function camelize(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function typecast(value) {
  try { return JSON.parse(value) } catch { return value }
}

function paramsForElement(element, identifier) {
  const params = {}
  const prefix = `data-${identifier}-`
  const suffix = "-param"
  for (const attr of element.attributes) {
    if (attr.name.startsWith(prefix) && attr.name.endsWith(suffix)) {
      const key = camelize(attr.name.slice(prefix.length, -suffix.length))
      params[key] = typecast(attr.value)
    }
  }
  return Object.freeze(params)
}

function bindDelegatedActions(controller) {
  const actions = controller.constructor.actions
  if (!actions || typeof actions !== "object") return []
  const identifier = controller.identifier
  const listeners = []

  Object.entries(actions).forEach(([key, descriptors]) => {
    const descriptorList = Array.isArray(descriptors) ? descriptors : [descriptors]
    const isWindow = key === "window"
    const isElement = key === "element"
    let targetName
    if (!isWindow && !isElement) {
      if (key.endsWith("Targets")) targetName = key.slice(0, -7)
      else if (key.endsWith("Target")) targetName = key.slice(0, -6)
      else targetName = key
    }

    descriptorList.forEach(descriptor => {
      const parsed = parseDescriptor(descriptor)
      if (!parsed) return
      const { eventName, filter, methodName, options } = parsed

      let listenTarget, guard
      if (isWindow) {
        listenTarget = window
        guard = () => true
      } else if (isElement) {
        listenTarget = controller.element
        guard = (event) => !options.includes("self") || event.target === controller.element
      } else {
        const selector = `[data-${identifier}-target~="${targetName}"]`
        listenTarget = controller.element
        guard = (event) => {
          const matched = event.target.closest(selector)
          if (!matched || !controller.element.contains(matched)) return false
          if (options.includes("self") && event.target !== matched) return false
          return matched
        }
      }

      const handler = (event) => {
        const match = guard(event)
        if (!match) return
        if (filter && event.key !== (KEY_MAP[filter] || filter)) return
        if (options.includes("stop")) event.stopPropagation()
        if (options.includes("prevent")) event.preventDefault()
        if (match instanceof Element) {
          Object.defineProperty(event, "currentTarget", { value: match, configurable: true })
          Object.defineProperty(event, "params", {
            value: paramsForElement(match, identifier),
            configurable: true,
          })
        }
        controller[methodName](event)
      }
      const capture = !isWindow && !isElement
      listenTarget.addEventListener(eventName, handler, capture)
      listeners.push({ target: listenTarget, eventName, handler, capture })
    })
  })

  return listeners
}

function unbindDelegatedActions(listeners) {
  listeners.forEach(({ target, eventName, handler, capture }) => {
    target.removeEventListener(eventName, handler, capture)
  })
}

export class Controller extends StimulusController {
  initialize() {
    super.initialize()
    this._useActionListeners = []
    const userConnect = this.connect
    const userDisconnect = this.disconnect
    this.connect = () => {
      userConnect.call(this)
      this._useActionListeners = bindDelegatedActions(this)
    }
    this.disconnect = () => {
      unbindDelegatedActions(this._useActionListeners)
      this._useActionListeners = []
      userDisconnect.call(this)
    }
  }
}
