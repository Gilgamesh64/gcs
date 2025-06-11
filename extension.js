const vscode = require('vscode');

function activate(context) {
  console.log('GCS Language extension activated!');

  let disposable = vscode.commands.registerCommand('gcsLanguage.activate', function () {
    vscode.window.showInformationMessage('GCS Language activated by command!');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
