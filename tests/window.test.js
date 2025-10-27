import { describe, it, expect, beforeEach } from "vitest";
import { Application, Controller } from "@hotwired/stimulus";
import useActions from "../index.js";

function nextTick() { return new Promise((r) => setTimeout(r, 0)); }

describe("Window actions", () => {
  let app, root;

  beforeEach(async () => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
    app = Application.start(root);
    await nextTick();
  });

  it("handles multiple window events via array", async () => {
    root.innerHTML = `<div data-controller="demo"></div>`;
    const hits = { resize: 0, scroll: 0 };

    class DemoController extends Controller {
      connect() {
        useActions(this, { window: ["resize->onResize", "scroll->onScroll"] });
      }
      onResize() { hits.resize++; }
      onScroll() { hits.scroll++; }
    }

    app.register("demo", DemoController);
    await nextTick();

    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));

    expect(hits.resize).toBe(1);
    expect(hits.scroll).toBe(1);
  });
});

