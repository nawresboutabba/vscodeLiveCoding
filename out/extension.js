"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const os_1 = require("@arcsine/screen-recorder/lib/os");
const fs = require("fs");
const recorder_1 = require("./recorder");
const status_1 = require("./status");
const util_1 = require("./util");
const config_1 = require("./config");
const vsls = require("vsls");
async function activate(context) {
    let saga;
    const { performance, PerformanceObserver } = require('perf_hooks');
    var x = 1, y = 0, tnow, t0, t1, gitid;
    var ch = 'git commit -m ver' + y;
    let value2 = '';
    var indexName = 0;
    var data = '', changed = '', nameFile = '';
    let gitinfo;
    var list = [];
    const { exec } = require('child_process');
    util_1.Util.context = context;
    const nodemailer = require("nodemailer");
    const recorder = new recorder_1.Recorder();
    const status = new status_1.RecordingStatus();
    const liveshare = await vsls.getApi();
    async function stop() {
        await new Promise(resolve => setTimeout(resolve, 125)); // Allows for click to be handled properly
        if (status.counting) {
            status.stop();
        }
        else if (recorder.active) {
            status.stopping();
            recorder.stop();
        }
        else if (recorder.running) {
            status.stop();
            recorder.stop(true);
        }
    }
    async function initRecording() {
        if (!(await config_1.Config.getFFmpegBinary())) {
            vscode.window.showWarningMessage('FFmpeg binary location not defined, cannot record unless path is set.');
            return;
        }
        if (!(await config_1.Config.getDestFolder())) {
            vscode.window.showWarningMessage('Cannot record video without setting destination folder');
            return;
        }
        try {
            // await status.countDown();
        }
        catch (err) {
            vscode.window.showWarningMessage('Recording cancelled');
            return;
        }
        return true;
    }
    async function record(opts = {}) {
        try {
            if (!(await initRecording())) {
                return;
            }
            if ((liveshare === null || liveshare === void 0 ? void 0 : liveshare.peers) !== undefined) {
                let p = [];
                p = liveshare === null || liveshare === void 0 ? void 0 : liveshare.peers;
                if (p.length >= 0) {
                    const run = await recorder.run(opts);
                    status.start();
                    status.save();
                    const { file } = await run.output();
                    status.stop();
                    const choice = await vscode.window.showInformationMessage(`Session output ${file}`, 'Open', 'send', 'Dismiss');
                    if (choice === 'Open') {
                        await os_1.OSUtil.openFile(file);
                    }
                    else if (choice === 'send') {
                        //() vscode.env.clipboard.writeText(file);
                        var sender = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'nawrossab94@gmail.com',
                                pass: 'Nawres1994@'
                            }
                        });
                        var mail = {
                            from: "nawrossab94@gmail.com",
                            to: "hichem.dimassi@esprit.tn",
                            subject: "the video session",
                            text: "The video of the live coding",
                            attachments: [
                                {
                                    filename: file,
                                    // path: __dirname + '/mailtrap.png',
                                    //  cid: 'uniq-mailtrap.png' 
                                }
                            ]
                        };
                        sender.sendMail(mail, function (error, info) {
                            if (error) {
                                console.log(error);
                            }
                            else {
                                console.log("Email sent successfully: "
                                    + info.response);
                            }
                        });
                    }
                }
                else {
                    console.log("you have less than 2 users! ");
                    vscode.window.showWarningMessage('you have less than 2 users, please start the session and invite your groupe!');
                }
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(e.message);
            if (!recorder.active) {
                status.stop();
            }
        }
    }
    async function initializeLiveShare() {
        if (config_1.Config.getAutoRecordLiveShare()) {
            const vsls = await Promise.resolve().then(() => require('vsls'));
            const liveShare = await vsls.getApi();
            if (liveShare) {
                liveShare.onDidChangeSession((e) => {
                    if (e.session.role === vsls.Role.None) {
                        stop();
                    }
                    else {
                        record();
                    }
                });
            }
        }
    }
    // record();
    /***Hichem */
    context.subscriptions.push(vscode.commands.registerCommand('chronicler.relivesession', async () => {
        // vscode.window.showInputBox().then(value => {
        // 	if (!value) return;
        // 	vscode.window.showInformationMessage(value);
        // 	// show the next dialog, etc.
        // });
        const answer = await vscode.window.showInputBox().then(value => {
            if (!value)
                return;
            vscode.window.showInformationMessage(value);
            // show the next dialog, etc.
            if (vscode.workspace.workspaceFolders !== undefined) {
                console.log("ddddd : " + value2);
                fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/relieveSession.html', `<!DOCTYPE html>
       <html>
       
       <body>
       
         <video id="myVideo" width="100%" height="40%" controls>
         <source src="${value}" type="video/mp4">
       
         Your browser does not support HTML5 video.
         </video>
       
         <p>time seconds: <span id="demo"></span></p>
         <p>id commit(per sceonds): <span id="demo2"></span></p>
       
         <script>
       
         var jsonContent
       
         // Get the video element with id="myVideo"
         var vid = document.getElementById("myVideo");
       
         // Assign an ontimeupdate event to the video element, and execute a function if the current playback position has changed
         vid.ontimeupdate = function () { myFunction() };
       
         function myFunction() {
       
           // Display the current position of the video in a p element with id="demo"
           document.getElementById("demo").innerHTML = Math.round(vid.currentTime);
       
           fetch('savefile.json').then(response => response.json())
           .then(data => {
             jsonContent = data;
       
           })

           jsonContent = jsonContent.filter(function(x) { return x !== null }); 
       
           var searchField = "time";
           for (var i = 0; i < jsonContent.length; i++) {
           if (jsonContent[i][searchField] == Math.round(vid.currentTime)) {
             document.getElementById("demo2").innerHTML = jsonContent[i]["id"];
             window.location.replace("http://localhost:8081/test/" + jsonContent[i]["id"] + "/" + jsonContent[i]["fileName"]);
             // handle err, stdout & stderr
       
           }
           }
       
         }
       
         </script>
       
       </body>
       
       </html>`, function (err) {
                    if (err)
                        throw err;
                    console.log('Saved!');
                });
            }
        });
        var connect = require('connect');
        var serveStatic = require('serve-static');
        const express = require('express');
        var app = express();
        const exec = require('child_process').exec;
        if (vscode.workspace.workspaceFolders !== undefined) {
            connect()
                .use(serveStatic(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length)))
                .listen(8080, () => console.log('Server running on 8080...'));
            app.listen(8081, () => console.log('Express server is listening et port N°:8081'));
        }
        app.get('/test/:id/:namefile', (req, res) => {
            var id = req.params.id;
            var nameFile = req.params.namefile;
            if (vscode.workspace.workspaceFolders !== undefined) {
                if (id !== "undefined" || id !== "HEAD") {
                    exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git checkout -f ' + id, (err, stdout, stderr) => {
                        // handle err, stdout & stderr
                    });
                    console.log("done");
                }
                if (nameFile != "undefined") {
                    vscode.workspace.openTextDocument(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/' + nameFile).then(doc => {
                        vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
                    });
                }
            }
            console.log(id);
            res.writeHead(200);
        });
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080/relieveSession.html'));
    }));
    /*****end hichem */
    // async function testLiveShare(): Promise<void> {
    //   const liveShare = await vsls.getApi();
    //   if (liveShare) {
    //     console.log('VSLS API available.');
    //     console.log('liveShare.session.user is always null, meaning ' +
    //       'that access to this info is always restricted');
    //     console.log(JSON.stringify(liveShare.session));
    //     console.log('Host:');
    //     console.log('Trying to get sharedService.');
    //     console.log('Should always create successfully according to ' +
    //       'docs, but returns null when run in debug, meaning access is ' +
    //       'always restricted');
    //     const sharedService = await liveShare.shareService('minExample');
    //     console.log(JSON.stringify(sharedService));
    //     console.log('Guest:');
    //     console.log('Trying to get sharedServiceProxy');
    //     console.log('always created successfully, so access to proxy ' +
    //       'is not restricted');
    //     const sharedServiceProxy = await liveShare.getSharedService('minExample');()
    //     console.log(JSON.stringify(sharedServiceProxy));
    //   } else {
    //     console.log('VSLS API not available.');
    //   }
    // }
    // vscode.commands.executeCommand('chronicler.rec', () =>  record());
    // vscode.commands.registerCommand('chronicler.rec',() =>  getAutoRecordLiveShare());
    vscode.commands.registerCommand('chronicler.stop', stop);
    vscode.commands.registerCommand('chronicler.record', () => record());
    vscode.commands.registerCommand('chronicler.recordGif', () => record({ animatedGif: true }));
    vscode.commands.registerCommand('chronicler.recordWithAudio', () => record({ audio: true }));
    vscode.commands.registerCommand('chronicler.recordWithDuration', async () => {
        const time = await vscode.window.showInputBox({
            prompt: 'Duration of recording (time in seconds)',
            placeHolder: '120'
        });
        //   if (time) {
        //     record({ duration: parseInt(time, 10) });
        //   }
    });
    // vscode.commands.registerCommand('chronicler.recordWithDuration',);
    context.subscriptions.push(recorder, status);
    initializeLiveShare();
    //   saga = createSagaMiddleware();
    //  saga.run(
    //   recorder
    //  );
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map