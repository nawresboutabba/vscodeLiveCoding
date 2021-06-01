"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recorder = void 0;
const screen_recorder_1 = require("@arcsine/screen-recorder");
const config_1 = require("./config");
class Recorder {
    get active() {
        return !!this.proc;
    }
    get finish() {
        return this.proc.finish;
    }
    dispose() {
        this.stop();
    }
    async postProcess(opts) {
        try {
            await this.proc.finish;
            if (opts.animatedGif) {
                const result = await screen_recorder_1.GIFCreator.generate(opts);
                if (result) {
                    const animated = await result.finish;
                    if (!opts.audio) { // Only default to GIF is not audio
                        opts.file = animated;
                    }
                }
            }
            return opts;
        }
        finally {
            this.proc.stop(true);
            delete this.proc;
        }
    }
    async run(override = {}) {
        const binary = (await config_1.Config.getFFmpegBinary());
        const opts = {
            ...config_1.Config.getRecordingDefaults(),
            file: await config_1.Config.getFilename(),
            ...override,
            ffmpeg: {
                binary
            }
        };
        if (this.proc) {
            throw new Error('Recording already in progress');
        }
        this.proc = await screen_recorder_1.Recorder.recordActiveWindow(opts);
        return {
            output: async () => {
                const newOpts = (await this.proc.finish);
                return this.postProcess(newOpts);
            }
        };
    }
    get running() {
        return !!this.proc;
    }
    stop(force = false) {
        if (!this.running) {
            throw new Error('info:No recording running');
        }
        try {
            this.proc.stop(force);
        }
        catch (_a) {
            this.proc.stop(true);
        }
    }
}
exports.Recorder = Recorder;
//# sourceMappingURL=recorder.js.map