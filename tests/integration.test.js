import { describe, it, expect, beforeEach } from "vitest";
import { Application, Controller } from "@hotwired/stimulus";
import useActions from "../index.js";

function nextTick() {
  return new Promise((r) => setTimeout(r, 0));
}

describe("Stimulus integration", () => {
  let app, root;

  beforeEach(async () => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    app = Application.start(root);
    await nextTick();
  });

  it("handles plural targets with prefixed events", async () => {
    // Build DOM with controller and two target elements
    root.innerHTML = `
      <div data-controller="demo">
        <button id="a" data-demo-target="button"></button>
        <button id="b" data-demo-target="button"></button>
      </div>
    `;

    const calls = { submit: 0, preview: 0, reflow: 0 };

    class DemoController extends Controller {
      static targets = ["button"];
      connect() {
        useActions(this, {
          buttonTargets: ["click->submit", "keyup->preview"],
          window: "resize->reflow",
        });
      }
      submit() { calls.submit++; }
      preview() { calls.preview++; }
      reflow() { calls.reflow++; }
    }

    app.register("demo", DemoController);
    await nextTick();

    const btnA = document.getElementById("a");
    const btnB = document.getElementById("b");

    // Fire events on buttons
    btnA.dispatchEvent(new Event("click", { bubbles: true }));
    btnB.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    // Fire resize on window
    window.dispatchEvent(new Event("resize"));

    expect(calls.submit).toBe(1);
    expect(calls.preview).toBe(1);
    expect(calls.reflow).toBe(1);
  });

  it("handles single target without event prefix (defaults to click)", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="only" data-demo-target="button"></button>
      </div>
    `;

    let called = 0;
    class DemoController extends Controller {
      static targets = ["button"];
      connect() { useActions(this, { buttonTarget: "submit" }); }
      submit() { called++; }
    }

    app.register("demo", DemoController);
    await nextTick();
    const btn = document.getElementById("only");
    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(called).toBe(1);
  });

  it("binds events directly to the controller element", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`;

    let called = 0;
    class DemoController extends Controller {
      connect() { useActions(this, { element: "click->clicked" }); }
      clicked() { called++; }
    }

    app.register("demo", DemoController);
    await nextTick();
    root.querySelector("[data-controller='demo']").dispatchEvent(new Event("click", { bubbles: true }));
    expect(called).toBe(1);
  });

  it("returns early when no actions are provided or found", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`;

    class DemoController extends Controller {
      connect() { useActions(this); }
    }
    app.register("demo", DemoController);
    await nextTick();

    const el = root.querySelector("[data-controller='demo']");
    expect(el.dataset.action).toBeUndefined();
  });

  it("supports multiple actions array on a single target", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="only" data-demo-target="button"></button>
      </div>
    `;
    const called = { a: 0, b: 0 };
    class DemoController extends Controller {
      static targets = ["button"];
      connect() { useActions(this, { buttonTarget: ["click->a", "click->b"] }); }
      a() { called.a++; }
      b() { called.b++; }
    }
    app.register("demo", DemoController);
    await nextTick();
    const btn = document.getElementById("only");
    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(called.a).toBe(1);
    expect(called.b).toBe(1);
  });
});
