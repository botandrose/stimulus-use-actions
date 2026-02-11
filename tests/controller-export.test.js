import { describe, it, expect, beforeEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import { Controller } from "../index.js"

function nextTick() { return new Promise((r) => setTimeout(r, 0)) }

describe("exported Controller base (delegation)", () => {
  let app, root

  beforeEach(async () => {
    document.body.innerHTML = ""
    root = document.createElement("div")
    document.body.appendChild(root)
    app = Application.start(root)
    await nextTick()
  })

  it("delegates events to target elements", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { submit: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->submit" }
      submit() { calls.submit++ }
    }
    app.register("demo", DemoController)
    await nextTick()
    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.submit).toBe(1)
  })

  it("handles multiple targets with different events", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
        <input id="inp" data-demo-target="input" />
      </div>
    `
    const calls = { clicked: 0, changed: 0 }
    class DemoController extends Controller {
      static targets = ["button", "input"]
      static actions = {
        buttonTarget: "click->clicked",
        inputTarget: "change->changed",
      }
      clicked() { calls.clicked++ }
      changed() { calls.changed++ }
    }
    app.register("demo", DemoController)
    await nextTick()
    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    document.getElementById("inp").dispatchEvent(new Event("change", { bubbles: true }))
    expect(calls.clicked).toBe(1)
    expect(calls.changed).toBe(1)
  })

  it("supports array of descriptors per target", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { a: 0, b: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: ["click->a", "mousedown->b"] }
      a() { calls.a++ }
      b() { calls.b++ }
    }
    app.register("demo", DemoController)
    await nextTick()
    const btn = document.getElementById("btn")
    btn.dispatchEvent(new Event("click", { bubbles: true }))
    btn.dispatchEvent(new Event("mousedown", { bubbles: true }))
    expect(calls.a).toBe(1)
    expect(calls.b).toBe(1)
  })

  it("binds window events and cleans up on disconnect", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { resized: 0 }
    class DemoController extends Controller {
      static actions = { window: "resize->resized" }
      resized() { calls.resized++ }
    }
    app.register("demo", DemoController)
    await nextTick()
    window.dispatchEvent(new Event("resize"))
    expect(calls.resized).toBe(1)

    root.querySelector("[data-controller='demo']").remove()
    await nextTick()
    window.dispatchEvent(new Event("resize"))
    expect(calls.resized).toBe(1)
  })

  it("handles dynamically added targets", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const btn = document.createElement("button")
    btn.dataset.demoTarget = "button"
    root.querySelector("[data-controller='demo']").appendChild(btn)
    btn.dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("cleans up element listeners on disconnect", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)

    const el = root.querySelector("[data-controller='demo']")
    el.removeAttribute("data-controller")
    await nextTick()

    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("ignores events from non-target elements", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
        <button id="other"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("other").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(0)
  })

  it("matches when child of target triggers event", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <div data-demo-target="button">
          <span id="child">Click me</span>
        </div>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("child").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("supports key filter with KEY_MAP", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <input id="inp" data-demo-target="field" />
      </div>
    `
    const calls = { submitted: 0 }
    class DemoController extends Controller {
      static targets = ["field"]
      static actions = { fieldTarget: "keydown.enter->submitted" }
      submitted() { calls.submitted++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const inp = document.getElementById("inp")
    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(calls.submitted).toBe(1)

    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
    expect(calls.submitted).toBe(1)
  })

  it("supports key filter with unmapped key name", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <input id="inp" data-demo-target="field" />
      </div>
    `
    const calls = { handled: 0 }
    class DemoController extends Controller {
      static targets = ["field"]
      static actions = { fieldTarget: "keydown.a->handled" }
      handled() { calls.handled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const inp = document.getElementById("inp")
    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
    expect(calls.handled).toBe(1)

    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }))
    expect(calls.handled).toBe(1)
  })

  it("supports key filter on window events", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { escaped: 0 }
    class DemoController extends Controller {
      static actions = { window: "keydown.esc->escaped" }
      escaped() { calls.escaped++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    expect(calls.escaped).toBe(1)

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
    expect(calls.escaped).toBe(1)
  })

  it("supports :stop and :prevent options", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: "click->clicked:stop:prevent" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const btn = document.getElementById("btn")
    const event = new Event("click", { bubbles: true, cancelable: true })
    const stopSpy = vi.spyOn(event, "stopPropagation")
    const preventSpy = vi.spyOn(event, "preventDefault")
    btn.dispatchEvent(event)
    expect(calls.clicked).toBe(1)
    expect(stopSpy).toHaveBeenCalled()
    expect(preventSpy).toHaveBeenCalled()
  })

  it("supports :self option", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <div id="target" data-demo-target="panel">
          <span id="child">inner</span>
        </div>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["panel"]
      static actions = { panelTarget: "click->clicked:self" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("child").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(0)

    document.getElementById("target").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("works with plural Targets key", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="a" data-demo-target="button"></button>
        <button id="b" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTargets: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("a").dispatchEvent(new Event("click", { bubbles: true }))
    document.getElementById("b").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(2)
  })

  it("works with bare target name key", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { button: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("skips descriptors without ->", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { buttonTarget: ["submit", "click->clicked"] }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("ignores target matches outside the controller element", async () => {
    root.innerHTML = `
      <div data-demo-target="item">
        <div data-controller="demo">
          <span id="inner">text</span>
        </div>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static targets = ["item"]
      static actions = { itemTarget: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("inner").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(0)
  })

  it("handles no static actions gracefully", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    class DemoController extends Controller {}
    app.register("demo", DemoController)
    await nextTick()

    const el = root.querySelector("[data-controller='demo']")
    expect(el).toBeTruthy()
  })

  it("supports :stop and :prevent on window events", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { handled: 0 }
    class DemoController extends Controller {
      static actions = { window: "keydown->handled:stop:prevent" }
      handled() { calls.handled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true })
    const stopSpy = vi.spyOn(event, "stopPropagation")
    const preventSpy = vi.spyOn(event, "preventDefault")
    window.dispatchEvent(event)
    expect(calls.handled).toBe(1)
    expect(stopSpy).toHaveBeenCalled()
    expect(preventSpy).toHaveBeenCalled()
  })

  it("supports window key filter with unmapped key name", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { handled: 0 }
    class DemoController extends Controller {
      static actions = { window: "keydown.a->handled" }
      handled() { calls.handled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
    expect(calls.handled).toBe(1)

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }))
    expect(calls.handled).toBe(1)
  })

  it("binds events directly to the controller element", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static actions = { element: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    root.querySelector("[data-controller='demo']").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("cleans up element listeners on disconnect for element key", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static actions = { element: "click->clicked" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const el = root.querySelector("[data-controller='demo']")
    el.dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)

    el.removeAttribute("data-controller")
    await nextTick()

    el.dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("supports key filter on element events", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { handled: 0 }
    class DemoController extends Controller {
      static actions = { element: "keydown.enter->handled" }
      handled() { calls.handled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const el = root.querySelector("[data-controller='demo']")
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(calls.handled).toBe(1)

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
    expect(calls.handled).toBe(1)
  })

  it("supports element key filter with unmapped key name", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { handled: 0 }
    class DemoController extends Controller {
      static actions = { element: "keydown.a->handled" }
      handled() { calls.handled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const el = root.querySelector("[data-controller='demo']")
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
    expect(calls.handled).toBe(1)

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }))
    expect(calls.handled).toBe(1)
  })

  it("supports :self on element events", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <span id="child">inner</span>
      </div>
    `
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static actions = { element: "click->clicked:self" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("child").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(0)

    root.querySelector("[data-controller='demo']").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("supports :stop and :prevent on element events", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { clicked: 0 }
    class DemoController extends Controller {
      static actions = { element: "click->clicked:stop:prevent" }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    const el = root.querySelector("[data-controller='demo']")
    const event = new Event("click", { bubbles: true, cancelable: true })
    const stopSpy = vi.spyOn(event, "stopPropagation")
    const preventSpy = vi.spyOn(event, "preventDefault")
    el.dispatchEvent(event)
    expect(calls.clicked).toBe(1)
    expect(stopSpy).toHaveBeenCalled()
    expect(preventSpy).toHaveBeenCalled()
  })

  it("works when subclass overrides connect without calling super", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `
    const calls = { clicked: 0, connected: false }
    class DemoController extends Controller {
      static targets = ["button"]
      static actions = { button: "click->clicked" }
      connect() {
        calls.connected = true
      }
      clicked() { calls.clicked++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    expect(calls.connected).toBe(true)
    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }))
    expect(calls.clicked).toBe(1)
  })

  it("delegates non-bubbling events from target elements", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <video id="vid" data-demo-target="video"></video>
      </div>
    `
    const calls = { played: 0 }
    class DemoController extends Controller {
      static targets = ["video"]
      static actions = { video: "play->played" }
      played() { calls.played++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    document.getElementById("vid").dispatchEvent(new Event("play"))
    expect(calls.played).toBe(1)
  })

  it("supports window array of descriptors", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`
    const calls = { resized: 0, scrolled: 0 }
    class DemoController extends Controller {
      static actions = { window: ["resize->resized", "scroll->scrolled"] }
      resized() { calls.resized++ }
      scrolled() { calls.scrolled++ }
    }
    app.register("demo", DemoController)
    await nextTick()

    window.dispatchEvent(new Event("resize"))
    window.dispatchEvent(new Event("scroll"))
    expect(calls.resized).toBe(1)
    expect(calls.scrolled).toBe(1)
  })
})
