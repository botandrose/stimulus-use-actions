import { describe, it, expect, beforeEach } from "vitest";
import { Application, Controller } from "@hotwired/stimulus";
import useActions, { withActions } from "../index.js";

function nextTick() { return new Promise((r) => setTimeout(r, 0)); }

describe("static actions support", () => {
  let app, root;

  beforeEach(async () => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    app = Application.start(root);
    await nextTick();
  });

  it("binds from static actions when calling useActions(this)", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="one" data-demo-target="button"></button>
      </div>
    `;

    const calls = { submit: 0 };
    class DemoController extends Controller {
      static targets = ["button"];
      static actions = { buttonTarget: "click->submit" };
      connect() { useActions(this); }
      submit() { calls.submit++; }
    }

    app.register("demo", DemoController);
    await nextTick();
    document.getElementById("one").dispatchEvent(new Event("click", { bubbles: true }));
    expect(calls.submit).toBe(1);
  });

  it("auto-binds via withActions() without calling connect helper", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="two" data-demo-target="button"></button>
      </div>
    `;

    const calls = { submit: 0 };
    class Base extends Controller {
      static targets = ["button"];
      static actions = { buttonTarget: "click->submit" };
      submit() { calls.submit++; }
    }
    const DemoController = withActions(Base);

    app.register("demo", DemoController);
    await nextTick();
    document.getElementById("two").dispatchEvent(new Event("click", { bubbles: true }));
    expect(calls.submit).toBe(1);
  });
});

