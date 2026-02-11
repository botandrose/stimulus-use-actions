# stimulus-use-actions

Declare Stimulus `data-action` bindings in JavaScript instead of HTML markup.

[![CI](https://github.com/botandrose/stimulus-use-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/botandrose/stimulus-use-actions/actions/workflows/ci.yml)

Requires Stimulus v3+ and ES modules.

## Quick Start

Import `Controller` from this package instead of `@hotwired/stimulus`. Declare
`static actions` alongside your `static targets` -- that's it.

```js
import { Controller } from "stimulus-use-actions"

export default class extends Controller {
  static targets = ["field", "checkbox"]

  static actions = {
    field: "input->update",
    checkbox: "change->rerender",
    element: "submit->save",
    window: "resize->layout",
  }

  update(event) { /* ... */ }
  rerender(event) { /* ... */ }
  save(event) { /* ... */ }
  layout(event) { /* ... */ }
}
```

Actions are bound via **event delegation** on the controller element. This
means:

- Listeners are added on `connect()` and removed on `disconnect()`
- Target elements can appear and disappear in the DOM at any time -- events are
  still captured
- No need to call `super.connect()` -- actions bind automatically

### Keys

Each key in `static actions` is a **target name** matching an entry in
`static targets`, or the special key `window`.

| Key       | Listens on          | Matches events from                          |
| --------- | ------------------- | -------------------------------------------- |
| `field`   | controller element  | descendants with `data-<id>-target="field"`  |
| `element` | controller element  | the controller element itself                |
| `window`  | `window`            | the window itself                            |

### Values

Values use Stimulus action descriptor syntax with an **explicit event**:

| Value                          | Meaning                                    |
| ------------------------------ | ------------------------------------------ |
| `"input->update"`              | listen for `input`, call `this.update()`   |
| `"click->save"`                | listen for `click`, call `this.save()`     |
| `["click->a", "keyup->b"]`     | multiple actions on one target             |

Stimulus modifiers work as usual, e.g. `"keyup.enter->submit"`.

## Lower-Level API: `useActions`

For cases where you need manual control (conditional bindings, dynamic action
maps, etc.), import `useActions` directly:

```js
import { Controller } from "@hotwired/stimulus"
import useActions from "stimulus-use-actions"

export default class extends Controller {
  static targets = ["button"]

  connect() {
    useActions(this, {
      buttonTargets: ["click->submit", "keyup->preview"],
      element: "submit->save",
      window: "resize->reflow",
    })
  }

  submit() { /* ... */ }
  preview() { /* ... */ }
  reflow() { /* ... */ }
}
```

`useActions` binds directly to target elements (no delegation). It does **not**
clean up on disconnect -- Stimulus handles this through its own binding
observer.

### `useActions(controller, actions?)`

- **controller** -- your Stimulus controller instance (`this`)
- **actions** -- map of target keys to action descriptors
  - Keys: `<name>Target`, `<name>Targets`, `element`, or `window`
  - Values: a string or array of `"event->method"` strings
  - Event inference (e.g. `"submit"` without `click->`) is supported here --
    Stimulus infers the default event for the element
  - If omitted, reads from `controller.constructor.actions`

A `withActions(BaseController)` wrapper is also available -- it returns a
subclass that auto-calls `useActions(this)` in `connect()`.

## Notes

- `useActions` binds once per call -- calling repeatedly adds duplicate
  bindings.
- The `Controller` base class uses delegation -- no duplicates, automatic
  cleanup.
- Keep method names in sync with your controller; mismatches throw at runtime.
