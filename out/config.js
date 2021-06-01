"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const os = require("os");
const util = require("util");
const os_1 = require("@arcsine/screen-recorder/lib/os");
const screen_recorder_1 = require("@arcsine/screen-recorder");
const exists = util.promisify(fs.exists);
const home = process.env.HOME || process.env.USERPROFILE;
class Config {
    static get _config() {
        return vscode.workspace.getConfiguration();
    }
    static hasConfig(key) {
        const conf = this.getConfig(key);
        return conf !== null && conf !== undefined && conf !== '';
    }
    static getConfig(key) {
        return this._config.has(`chronicler.${key}`) ? this._config.get(`chronicler.${key}`) : null;
    }
    static async setConfig(key, value) {
        return await this._config.update(`chronicler.${key}`, value, vscode.ConfigurationTarget.Global);
    }
    static isDebugMode() {
        return !!this._config.get('chronicler.debug');
    }
    static getRecordingDefaults() {
        return {
            duration: 0,
            fps: 10,
            animatedGif: false,
            countdown: 5,
            ...(this._config.get('chronicler.recording-defaults') || {})
        };
    }
    static async getDestFolder() {
        if (!this.hasConfig('dest-folder')) {
            const res = await vscode.window.showInformationMessage('The recording output folder has not been set. Would you like to select a folder, or default to ~/Recordings ?', 'Select Output Folder', 'Default to ~/Recordings');
            if (res) {
                if (res.startsWith('Select')) {
                    await this.getLocation('dest-folder', {
                        title: 'Recording Location',
                        executable: false,
                        folder: true,
                        defaultName: `${home}/Recordings`
                    });
                }
                else {
                    await this.setConfig('dest-folder', '~/Recordings');
                }
            }
        }
        if (!this.hasConfig('dest-folder')) {
            throw new Error('Cannot proceed with recording, as no destination folder has been selected');
        }
        return this.getConfig('dest-folder').replace(/^~/, home || '.');
    }
    static async getFilename() {
        const dir = await this.getDestFolder();
        const folders = vscode.workspace.workspaceFolders;
        const ws = folders ? folders[0].name.replace(/[^A-Za-z0-9\-_]+/g, '_') : `vscode`;
        const base = `${ws}-${new Date().getTime()}.mp4`;
        if (!(await exists(dir))) {
            await util.promisify(fs.mkdir)(dir);
        }
        return path.join(dir, base);
    }
    static async getLocation(key, options) {
        if (!key || !this.hasConfig(key)) {
            const platform = os.platform();
            const folders = options.platformDefaults ?
                (options.platformDefaults[platform] || options.platformDefaults.x11 || []) : [];
            let valid = undefined;
            if (options.folder) {
                for (const p of folders) {
                    if (await exists(p)) {
                        valid = p;
                        break;
                    }
                }
            }
            else if (options.defaultName && options.executable) {
                try {
                    valid = await os_1.OSUtil.findFileOnPath(options.defaultName, folders);
                }
                catch (e) { /* ignore */ }
            }
            let file;
            if (valid) {
                file = valid;
            }
            else {
                await new Promise((resolve) => setTimeout(resolve, 150));
                const res = await vscode.window.showOpenDialog({
                    openLabel: `Select ${options.title}`,
                    canSelectFiles: !options.folder,
                    canSelectFolders: options.folder,
                    canSelectMany: false,
                    defaultUri: valid ? vscode.Uri.file(valid) : undefined
                });
                if (!res || res.length === 0) {
                    return;
                }
                file = res[0].fsPath;
            }
            if ((await exists(file)) && (!options.validator || (await options.validator(file)))) {
                if (key) {
                    await this.setConfig(key, file);
                }
            }
            else {
                throw new Error(`Invalid location for ${options.title}: ${file}`);
            }
            if (options.onAdd) {
                await options.onAdd(file);
            }
            return file;
        }
        else {
            return this.getConfig(key);
        }
    }
    static async getFFmpegBinary() {
        if (this.hasConfig('ffmpeg-binary')) {
            return this.getConfig('ffmpeg-binary');
        }
        const binName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
        const res = await vscode.window.showInformationMessage('FFMpeg is not set, would you like to find it in the filesystem or download the latest version?', 'Find in filesystem', 'Download');
        if (res === 'Download') {
            const output = await this.getLocation(null, {
                title: 'Download location',
                folder: true,
                executable: false
            });
            if (!output) {
                throw new Error('FFMpeg download location not selected');
            }
            let downloader;
            vscode.window.withProgress({
                title: 'Downloading FFMpeg',
                location: vscode.ProgressLocation.Notification
            }, async (progress, token) => {
                downloader = screen_recorder_1.DownloadUtil.downloadComponent({
                    destination: output,
                    progress: pct => {
                        progress.report({ increment: Math.trunc(pct * 100) });
                    }
                });
                await downloader;
            });
            const loc = await downloader;
            await this.setConfig('ffmpeg-binary', loc);
            return loc;
        }
        else if (res === 'Find in filesystem') {
            return await this.getLocation('ffmpeg-binary', {
                title: 'FFMpeg Binary',
                folder: false,
                defaultName: binName,
                executable: true,
                validator: file => /ffmpeg/i.test(file)
            });
        }
    }
    static getAutoRecordLiveShare() {
        return this.getConfig('auto-record-live-share');
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map