"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
const vscode = require("vscode");
const path = require("path");
class Util {
    static getWorkspacePath() {
        const folders = vscode.workspace.workspaceFolders;
        return folders ? folders[0].uri.fsPath : undefined;
    }
    static getResource(rel) {
        return path.resolve(this.context.extensionPath, rel.replace(/\//g, path.sep)).replace(/\\/g, '/');
    }
}
exports.Util = Util;
//# sourceMappingURL=util.js.map