import * as vscode from 'vscode';
import { Config } from './config';
import * as fs from 'fs';
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');
var x = 1, y = 0, tnow, t0: number, t1, gitid: string;
var ch = 'git commit -m ver' + y;
var indexName = 0;
var data = '', changed = '', nameFile = '';
let gitinfo: { id: string; name: string; time: number; fileName: string; };
var list: { id: string; name: string; time: number; fileName: string; }[] = [];
//var x = 1;
let value2 = '';

const { exec } = require('child_process');
function clean(x: number) {
  let res = `${Math.trunc(x)}`;
  if (res.length < 2) {
    res = `0${res}`;
  }
  return res;
}

export class RecordingStatus {

  private item: vscode.StatusBarItem;
  timeout: NodeJS.Timer;
  counting = false;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    this.stop();
    this.item.show();
  }
  async save(){
   // x = 1;
    if (vscode.workspace.workspaceFolders !== undefined) {
      x = 1;
      const answer = await vscode.window.showInformationMessage(

        vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length)

      );

      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & rmdir /s /q .git', () => {
        // handle err, stdout & stderr
      });

      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git init', () => {
        // handle err, stdout & stderr
      });

      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & echo savefile.json > .gitignore', (err: any, stdout: any, stderr: any) => {
        // handle err, stdout & stderr
      });

      fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/savefile.json', "", function (err) {
        if (err) throw err;
        console.log('Saved!');
      })

      

      t0 = performance.now()
      while (x == 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand("workbench.action.files.saveAll");
        //vscode.workspace.workspaceFile.;


        await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git add --all', () => {
          // handle err, stdout & stderr
        });


        exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git diff --exit-code', (err: any, stdout: string, stderr: any) => {
          // handle err, stdout & stderr
          changed = stdout;
        });


        //console.log("aaaaa" + changed + "bbbbb");
        if (changed !== '') {


          await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & ' + ch, () => {
            // handle err, stdout & stderr
          });

          await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git rev-parse HEAD', (err: any, stdout: string, stderr: any) =>

            gitid = stdout.substring(0, stdout.length - 1)

          );


          t1 = performance.now()
          if (vscode.window.activeTextEditor !== undefined) {
            tnow = t1 - t0;
            indexName = vscode.window.activeTextEditor.document.uri.path.substring(1).lastIndexOf('/');
            console.log("index : " + indexName);
            nameFile = vscode.window.activeTextEditor.document.uri.path.substring(indexName + 2)
            gitinfo = {
              id: gitid,
              name: 'ver' + y,
              time: Math.round(tnow / 1000),
              fileName: nameFile
            }
          }

          list.push(gitinfo);

          data = JSON.stringify(list, null, 2),
            fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/savefile.json', data, function (err) {
              if (err) throw err;
              console.log('Saved!');
            });

          console.log(ch);
          console.log("state: " + x);

          y++;

        }

      }


      

      await vscode.commands.executeCommand("workbench.action.files.saveAll");



      setTimeout(function () {
        if (vscode.workspace.workspaceFolders !== undefined) {
          exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git add --all & git commit -m verFinale & git rev-parse HEAD', (err: any, stdout: string, stderr: any) => {
            gitid = stdout.substring(0, stdout.length - 1)
          });
        }
      }, 3000);



      t1 = performance.now()
      if (vscode.window.activeTextEditor !== undefined) {
        tnow = t1 - t0;
        indexName = vscode.window.activeTextEditor.document.uri.path.substring(1).lastIndexOf('/');
        console.log("index : " + indexName);
        nameFile = vscode.window.activeTextEditor.document.uri.path.substring(indexName + 2)
        gitinfo = {
          id: gitid,
          name: 'ver' + y,
          time: Math.round(tnow / 1000),
          fileName: nameFile
        }
      }

      list.push(gitinfo);

      data = JSON.stringify(list, null, 2),
        fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/savefile.json', data, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });

      console.log(ch);
      console.log("state: " + x);



    }}
   
  show() {
    this.item.show();
  }

  dispose() {
    this.recordingStopped();
    this.item.dispose();
  }

  async stop() {
    x=0;
    this.recordingStopped();
    this.item.command = 'chronicler.record';
    this.item.text = '$(triangle-right) liveRecorder';
    this.item.color = 'white';
    this.counting = false;
   
  }

  async stopping() {
    x=0;
    this.recordingStopped();
    this.counting = false;
    this.item.text = '$(pulse) liveRecorder Stopping...';
    this.item.color = '#ffff00';
    if (vscode.workspace.workspaceFolders !== undefined) {

      fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/finishrecording.txt', "Thenk you for using Live-Coding :)", function (err) {
        if (err) throw err;
        console.log('Saved!');
      });	await vscode.commands.executeCommand("workbench.action.files.saveAll");
      //vscode.workspace.workspaceFile.;


      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git add --all', () => {
        // handle err, stdout & stderr
      });



      //console.log("aaaaa" + changed + "bbbbb");



      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & ' + ch, () => {
        // handle err, stdout & stderr
      });

      await exec('cd ' + vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + ' & git rev-parse HEAD', (err: any, stdout: string, stderr: any) =>

        gitid = stdout.substring(0, stdout.length - 1)

      );


      t1 = performance.now()
      if (vscode.window.activeTextEditor !== undefined) {
        tnow = t1 - t0;
        indexName = vscode.window.activeTextEditor.document.uri.path.substring(1).lastIndexOf('/');
        console.log("index : " + indexName);
        nameFile = vscode.window.activeTextEditor.document.uri.path.substring(indexName + 2)
        gitinfo = {
          id: gitid,
          name: 'verFinale',
          time: Math.round(tnow / 1000),
          fileName: nameFile
        }
      }

      list.push(gitinfo);

      data = JSON.stringify(list, null, 2),
        fs.writeFile(vscode.workspace.workspaceFolders[0].uri.path.substring(1, vscode.workspace.workspaceFolders[0].uri.path.length) + '/savefile.json', data, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });

    }

      
  }

  recordingStopped() {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
  }

  start() {
    this.item.command = 'chronicler.stop';
    this.item.text = '$(primitive-square) liveRecorder';
    this.item.color = '#ff8888';

    const start = Date.now();
    const og = this.item.text;
    const sec = 1000;
    const min = sec * 60;
    const hour = min * 60;

    const update = () => {
      const time = Date.now() - start;
      let timeStr = `${clean((time / min) % 60)}:${clean((time / sec) % 60)}`;
      if (time > hour) {
        timeStr = `${Math.trunc(time / hour)}:${timeStr}`;
      }
      this.item.text = `${og}: ${timeStr}`;
    };

    this.timeout = setInterval(update, 1000);

    update();
  }
 
  
 async countDown(seconds?: number) {
    if (seconds === undefined) {
      const defs = await Config.getRecordingDefaults();
      seconds = defs.countdown || 0;
    }

    this.item.command = 'chronicler.stop';

    this.counting = true;

    const colors = ['#ffff00', '#ffff33', '#ffff66', '#ffff99', '#ffffcc'];

    for (let i = seconds; i > 0; i--) {
      this.item.color = colors[i];
      this.item.text = `$(pulse) Starting in ${i} seconds`;
      await new Promise(r => setTimeout(r, 1000));
      if (!this.counting) {
        throw new Error('Countdown canceled');
      }
    }

    this.counting = false;
    this.item.text = '$(pulse) liveRecorderr Starting ...';
    this.item.color = colors[0];
  }
}