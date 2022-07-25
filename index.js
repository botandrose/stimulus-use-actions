export default function(controller, actions) {
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

