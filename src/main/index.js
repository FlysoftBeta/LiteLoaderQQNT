const { Module } = require("module");
const { app, ipcMain } = require("electron");
const { LiteLoader } = require("./base.js");
const { PluginLoader } = require("./loader.js");


// 监听窗口创建
function observeNewBrowserWindow(callback) {
    const original_load = Module._load;
    Module._load = (...args) => {
        const loaded_module = original_load(...args);

        if (args[0] != "electron") {
            return loaded_module;
        }

        // Hook BrowserWindow
        class HookedBrowserWindow extends loaded_module.BrowserWindow {
            constructor(original_config) {
                const config = {
                    ...original_config,
                    webPreferences: {
                        ...original_config?.webPreferences,
                        devTools: true,
                        webSecurity: false
                    }
                };
                super(config);
                callback(this);
            }
        }

        return {
            ...loaded_module,
            BrowserWindow: HookedBrowserWindow
        }
    }
}


// 插件加载器
const plugin_loader = new PluginLoader();


// 让插件加载只执行一次
app.on("ready", () => {
    plugin_loader.onLoad();
});


// 监听窗口创建
observeNewBrowserWindow(window => {
    // DevTools切换
    window.webContents.on("before-input-event", (event, input) => {
        if (input.key == "F12" && input.type == "keyUp") {
            window.webContents.toggleDevTools();
        }
    });

    // 触发窗口创建
    plugin_loader.onBrowserWindowCreated(window);
});


ipcMain.on("LiteLoader.LiteLoader.path", (event, message) => {
    event.returnValue = LiteLoader.path;
});

ipcMain.on("LiteLoader.LiteLoader.versions", (event, message) => {
    event.returnValue = LiteLoader.versions;
});

ipcMain.on("LiteLoader.LiteLoader.plugins", (event, message) => {
    event.returnValue = plugin_loader.getPlugins;
});

ipcMain.on("LiteLoader.LiteLoader.package", (event, message) => {
    event.returnValue = LiteLoader.package;
});

ipcMain.on("LiteLoader.LiteLoader.os", (event, message) => {
    event.returnValue = LiteLoader.os;
});

ipcMain.on("LiteLoader.LiteLoader.config", (event, message) => {
    event.returnValue = LiteLoader.config;
});
