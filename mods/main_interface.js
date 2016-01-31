combine(windowRequrie, {
    config: requireConfig,
    ajax: ajax,
    loadScript: loadScript
});
window.require = windowRequrie;
window.define = windowDefine;

requireConfig();
