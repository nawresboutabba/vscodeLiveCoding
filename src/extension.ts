import * as vscode from 'vscode';
import { OSUtil } from '@arcsine/screen-recorder/lib/os';

import { Recorder } from './recorder';
import { RecordingStatus } from './status';

import { Util } from './util';
import { RecordingOptions } from './types';
import { Config } from './config';
import * as vsls from 'vsls';
import { start } from 'repl';

export async function activate(context: vscode.ExtensionContext) {

  Util.context = context;
  const nodemailer = require("nodemailer");
  const recorder = new Recorder();
  const status = new RecordingStatus();
  const liveshare = await vsls.getApi();

  async function stop() {
    await new Promise(resolve => setTimeout(resolve, 125)); // Allows for click to be handled properly
    if (status.counting) {
      status.stop();
    } else if (recorder.active) {
      status.stopping();
      recorder.stop();
    } else if (recorder.running) {
      status.stop();
      recorder.stop(true);
    }
  }

  async function initRecording() {
    if (!(await Config.getFFmpegBinary())) {
      vscode.window.showWarningMessage('FFmpeg binary location not defined, cannot record unless path is set.');
      return;
    }

    if (!(await Config.getDestFolder())) {
      vscode.window.showWarningMessage('Cannot record video without setting destination folder');
      return;
    }

    try {
      await status.countDown();
    } catch (err) {
      vscode.window.showWarningMessage('Recording cancelled');
      return;
    }

    return true;
  }

  async function record(opts: Partial<RecordingOptions> = {}) {
    try {
      if (!(await initRecording())) {
        return;
      }

      const run = await recorder.run(opts);
      status.start();

      const { file } = await run.output();
      status.stop();

      const choice = await vscode.window.showInformationMessage(`Session output ${file}`, 'Open', 'send', 'Dismiss');

      if (choice === 'Open') {
        await OSUtil.openFile(file);
      } else if (choice === 'send') {
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
        to: "nawres.boutabba@esprit.tn",
        subject: "Sending Email using Node.js",
        text: "The video of the live coding",
        attachments: [
          {
            filename: file,
           // path: __dirname + '/mailtrap.png',
          //  cid: 'uniq-mailtrap.png' 
          }
        ]
      };
       
      sender.sendMail(mail, function(error: any, info: { response: string; }) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent successfully: "
                       + info.response);
        }
      });
   

      }

    } catch (e) {
      vscode.window.showErrorMessage(e.message);
      if (!recorder.active) {
        status.stop();
      }
    }
  }

  async function initializeLiveShare() {
    if (Config.getAutoRecordLiveShare()) {
      const vsls = await import('vsls');
      const liveShare = await vsls.getApi();
  
      if (liveShare) {
        liveShare.onDidChangeSession((e) => {
          if (e.session.role === vsls.Role.None) {
            stop();
          } else {
            record();
          }
        });
      }
    } 

  }
  async function testLiveShare(): Promise<void> {
    const liveShare = await vsls.getApi();
  
    if (liveShare) {
      console.log('VSLS API available.');
      console.log('liveShare.session.user is always null, meaning ' +
        'that access to this info is always restricted');
      console.log(JSON.stringify(liveShare.session));
  
      console.log('Host:');
      console.log('Trying to get sharedService.');
      console.log('Should always create successfully according to ' +
        'docs, but returns null when run in debug, meaning access is ' +
        'always restricted');
      const sharedService = await liveShare.shareService('minExample');
      console.log(JSON.stringify(sharedService));
  
      console.log('Guest:');
      console.log('Trying to get sharedServiceProxy');
      console.log('always created successfully, so access to proxy ' +
        'is not restricted');
      const sharedServiceProxy = await liveShare.getSharedService('minExample');
      console.log(JSON.stringify(sharedServiceProxy));
    } else {
      console.log('VSLS API not available.');
    }
  }
 async function joi() {
    liveshare?.sh                             are
   }


  //vscode.commands.registerCommand('chronicler.startsession',initializeLiveShare);

  // vscode.commands.registerCommand('chronicler.share',() => {
  //  return liveshare?.join
  //  }); 
  vscode.commands.registerCommand('chronicler.share',() => {
		// The code you place here will be executed every time your command is executed

		testLiveShare();
	});
  vscode.commands.registerCommand('chronicler.stop', stop);
  vscode.commands.registerCommand('chronicler.record', () => start());
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
}