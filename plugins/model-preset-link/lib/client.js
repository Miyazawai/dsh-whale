var module = { exports: {} }; var exports = module.exports; window.__ModuleLoader__.load({ id: "@dsh-whale/model-preset-link", factory: (require) => {
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugins/model-preset-link/src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var inject = ["sessions", "modelDirectories", "connection", "remote", "slots"];
var LS_KEY = "dsh-whale.model-preset-link.enabled";
var FAMILIES = {
  flash: ["router-standard"],
  pro: ["anchored-standard", "zero-anchored-standard", "whoami-standard"]
};
var PATTERNS = { flash: /flash/i, pro: /pro/i };
function familyOf(modelId) {
  for (const [family, re] of Object.entries(PATTERNS)) {
    if (re.test(modelId)) return family;
  }
  return null;
}
function toggleLabel(enabled) {
  return enabled ? "\u81EA\u52A8\u5207\u6362\uFF1A\u5F00\uFF08flash\u2192Router Standard\uFF0Cpro\u2192Anchored Standard\uFF09" : "\u81EA\u52A8\u5207\u6362\uFF1A\u5173\uFF08\u624B\u52A8\u9009\u9884\u8BBE\uFF09";
}
function apply(ctx) {
  const { api } = ctx.get("connection");
  const enabled = () => localStorage.getItem(LS_KEY) !== "off";
  ctx.effect(() => {
    const stopList = ctx.sessions.list.subscribe(() => {
      const state = ctx.sessions.list.getSnapshot();
      const currentId = state.current;
      if (currentId === void 0 || !enabled()) return;
      const summary = state.byId[currentId];
      if (summary === void 0 || summary.blank !== true) return;
      const directory = ctx.modelDirectories.directoryFor(currentId);
      const current = directory.store.getSnapshot().current;
      if (current === void 0) return;
      const family = familyOf(String(current.model));
      if (family === null) return;
      const preset = FAMILIES[family]?.[0];
      if (preset === void 0 || summary.agentPreset === preset) return;
      api.agentPresets.select({ sessionId: currentId, agentPreset: preset }).then((result) => {
        if (!result.ok) console.warn("[model-preset-link] select failed:", result.error?.code);
      });
    });
    return () => stopList();
  }, "model-preset-link: session roster watch");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "model-preset-link",
    order: 60,
    label: () => "\u6A21\u578B\u2194\u9884\u8BBE\u8054\u52A8",
    component: () => ({
      render() {
        const el = document.createElement("div");
        const btn = document.createElement("button");
        btn.style.cssText = "font-family:ui-monospace,monospace;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;";
        const refresh = () => {
          btn.textContent = toggleLabel(enabled());
        };
        refresh();
        btn.addEventListener("click", () => {
          localStorage.setItem(LS_KEY, enabled() ? "off" : "on");
          refresh();
        });
        el.append(btn);
        return { dispose: () => {
        } };
      }
    })
  }), "model-preset-link: settings toggle");
}
return module.exports; } });
//# sourceMappingURL=client.js.map
