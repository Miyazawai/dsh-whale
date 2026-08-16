// plugins/model-preset-link/src/index.ts
var name = "model-preset-link";
var Config = {
  autoSwitch: true,
  families: {
    flash: ["router-standard"],
    pro: ["anchored-standard", "zero-anchored-standard", "whoami-standard"]
  },
  pluginStack: { flash: ["dsh-super-injector"], pro: [] },
  modelPatterns: { flash: "/flash/i", pro: "/pro/i" },
  fallbackFamily: "pro"
};
function apply(ctx, config) {
  ctx.provide("modelPresetLink", {
    config,
    getState: () => ({ autoSwitch: config.autoSwitch }),
    setAutoSwitch: (value) => {
      config.autoSwitch = value;
      return config.autoSwitch;
    }
  });
}
export {
  Config,
  apply,
  name
};
//# sourceMappingURL=index.js.map
