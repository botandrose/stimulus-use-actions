# stimulus-use-actions

Small helper for Stimulus controllers to declare `data-action` bindings in JavaScript, instead of markup.

[![CI](https://github.com/botandrose/stimulus-use-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/botandrose/stimulus-use-actions/actions/workflows/ci.yml)

Requires Stimulus v3+ and ES modules.

## Quick Example
```js
// controllers/demo_controller.js
import { Controller } from "@hotwired/stimulus";
import useActions from "stimulus-use-actions";

export default class extends Controller {
  static targets = ["button"];

  connect() {
    useActions(this, {
      // plural targets: bind multiple events to each element
      buttonTargets: ["click->submit", "keyup->preview"],
      // window-scoped actions
      window: ["resize->reflow"],
    });
  }

  submit() { /* ... */ }
  preview() { /* ... */ }
  reflow() { /* ... */ }
}
```

### Using the built-in Controller
Import the base `Controller` from this package to auto-bind `static actions` without calling anything in `connect()`.

```js
import { Controller } from "stimulus-use-actions";

export default class extends Controller {
  static targets = ["button"];

  static actions = {
    buttonTarget: ["click->submit", "keyup->preview"],
    window: "resize->reflow",
  };

  submit() {}
  preview() {}
  reflow() {}
}
```

### Using `static actions = {}`
Define actions on the class and either:
- Call `useActions(this)` without the second argument; or
- Wrap your controller with `withActions()` to auto-bind in `connect()`.

```js
import useActions, { withActions } from "stimulus-use-actions";

class Base extends Controller {
  static targets = ["button"];
  static actions = {
    buttonTarget: ["click->submit", "keyup->preview"],
    window: "resize->reflow",
  };
  submit() {}
  preview() {}
  reflow() {}
  connect() { useActions(this); }
}

// Or auto-bind without calling in connect:
export default withActions(Base);
```

## API
`useActions(controller, actions)`

- `controller`: your Stimulus controller instance (`this`).
- `actions`: map of target keys to action descriptors.
  - Target keys: `<name>Target`, `<name>Targets`, or the special key `window`.
  - Values: a string (e.g., `"click->save"`, `"save"`) or an array of such strings.
  - If omitted, actions are read from `controller.constructor.actions`.

## Action Descriptors
- `"event->method"`: binds a specific DOM event to `controller.method`.
- `"method"` (no event): Stimulus infers the element’s default event (e.g., `click` for buttons, `input` for text inputs).
- Works with Stimulus modifiers, e.g. `"keyup.enter->submit"`.

## Target Resolution
- For `<name>Targets`, each element in that target list receives each action.
- For `<name>Target`, the single element receives each action.
- `window` binds to the `@window` target (e.g., `"resize->reflow"`).

## Notes
- Call once per controller instance (typically in `connect()`). Calling repeatedly will add duplicate bindings.
- Keep action names in sync with your controller methods; mismatches throw at runtime via Stimulus.
