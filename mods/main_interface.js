combine(windowRequrie, {
    config: requireConfig,
    loadScript: loadScript,
    noop: noop
});
window.require = windowRequrie;
window.define = windowDefine;

requireConfig();
