const vscode = require('vscode');

function activate(context) {
  console.log('Test extension activated!');
  vscode.window.showInformationMessage('Test extension is working!');

  let disposable = vscode.commands.registerCommand('test.hello', () => {
    vscode.window.showInformationMessage('Hello from test extension!');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
