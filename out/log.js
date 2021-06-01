"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const vscode = require("vscode");
const config_1 = require("./config");
class Log {
    static info(msg) {
        this.output.appendLine(`[INFO] ${msg}`);
    }
    static error(error) {
        this.output.appendLine(`[ERROR] ${error}`);
    }
    static debug(msg) {
        if (config_1.Config.isDebugMode()) {
            this.output.appendLine(`[ERROR] ${msg}`);
        }
    }
}
exports.Log = Log;
Log.output = vscode.window.createOutputChannel('liveRecorder');
//# sourceMappingURL=log.js.map