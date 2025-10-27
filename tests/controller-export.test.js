import { describe, it, expect, beforeEach } from "vitest";
import { Application } from "@hotwired/stimulus";
import { Controller } from "../index.js";

function nextTick() { return new Promise((r) => setTimeout(r, 0)); }

describe("exported Controller base", () => {
  let app, root;

  beforeEach(async () => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    app = Application.start(root);
    await nextTick();
  });

  it("auto-binds static actions without calling useActions manually", async () => {
    root.innerHTML = `
      <div data-controller="demo">
        <button id="btn" data-demo-target="button"></button>
      </div>
    `;

    const calls = { submit: 0 };
    class DemoController extends Controller {
      static targets = ["button"];
      static actions = { buttonTarget: "click->submit" };
      submit() { calls.submit++; }
    }
    app.register("demo", DemoController);
    await nextTick();
    document.getElementById("btn").dispatchEvent(new Event("click", { bubbles: true }));
    expect(calls.submit).toBe(1);
  });
});

