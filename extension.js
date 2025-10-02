const vscode = require('vscode');
const path = require('path');

function activate(context) {
  console.log('GCS Language extension is now active!');

  // Manual activation command
  let disposable = vscode.commands.registerCommand('gcs.activate', function () {
    vscode.window.showInformationMessage('GCS Language activated!');
  });
  context.subscriptions.push(disposable);

  // Commands and parameters
  const commands = [
    { label: 'MOV', detail: 'Moves the actor to absolute coordinates: `MOV x,y`' },
    { label: 'MOVREL', detail: 'Move actor relative to current position' },
    { label: 'ANI', detail: 'Changes the current animation' },
    { label: 'WAIT', detail: 'Pauses execution for given amount of seconds' },
    { label: 'SND', detail: 'Sends one message to the Stage MessageDispatcher' },
    { label: 'DO', detail: 'Executes another script' },
    { label: 'LISTEN', detail: 'Awaits for a message and then proceeds with the execution (optional maximum waiting time)' },
    { label: 'SKIP', detail: 'Skips one frame' }
  ];

  const animations = ['IDLE', 'WALK', 'ATTACK'];
  const messages = ['HIT_EVENT', 'ATTACK', 'END_SCENE'];
  const scripts = ['INTRO', 'CUTSCENE1', 'BOSS_BATTLE'];

  const docsPath = path.join(__dirname, 'docs');

  // Hover docs
  const docs = {
    MOV: 'Moves the actor to absolute coordinates: `MOV x,y`',
    MOVREL: 'Moves the actor relative to current position',
    ANI: 'Changes the current animation',
    WAIT: 'Pauses execution for given amount of seconds',
    SND: 'Sends one message to the Stage MessageDispatcher',
    DO: 'Executes another script',
    LISTEN: 'Awaits for a message and then proceeds with the execution (optional maximum waiting time)',
    SKIP: 'Skips one frame'
  };

  // Helper function
  function isNumeric(value) {
    return !isNaN(value) && value.trim() !== '';
  }

  // Completion Provider
  const provider = vscode.languages.registerCompletionItemProvider(
    { language: 'gcs' },
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position);
        const text = line.text;
        const tokens = text.trim().split(/\s+/);
        const commandTyped = tokens[0] ? tokens[0].toUpperCase() : '';
        const cursorIndex = position.character;

        if (!commandTyped || cursorIndex <= tokens[0].length) {
          return commands.map(cmd => {
            const item = new vscode.CompletionItem(cmd.label, vscode.CompletionItemKind.Keyword);
            item.detail = cmd.detail;
            if (cmd.label === 'MOV' || cmd.label === 'MOVREL') {
              item.insertText = new vscode.SnippetString(`${cmd.label} \${1:x},\${2:y}`);
            } else {
              item.insertText = undefined;
              item.kind = vscode.CompletionItemKind.Text;
              item.sortText = 'z';
            }
            return item;
          });
        }

        switch (commandTyped) {
          case 'MOV':
          case 'MOVREL':
            if (tokens.length === 1) return [new vscode.CompletionItem('x,y', vscode.CompletionItemKind.Value)];
            return [];
          case 'ANI':
            if (tokens.length === 1) {
              return animations.map(anim => {
                const item = new vscode.CompletionItem(anim, vscode.CompletionItemKind.Text);
                item.detail = 'Animation (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            }
            return [];
          case 'SND':
            if (tokens.length === 1) {
              return messages.map(msg => {
                const item = new vscode.CompletionItem(msg, vscode.CompletionItemKind.Text);
                item.detail = 'Message (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            }
            return [];
          case 'LISTEN':
            if (tokens.length === 1) {
              return messages.map(msg => {
                const item = new vscode.CompletionItem(msg, vscode.CompletionItemKind.Text);
                item.detail = 'Message (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            } else if (tokens.length === 2) {
              const item = new vscode.CompletionItem('time', vscode.CompletionItemKind.Value);
              item.detail = 'Optional maximum waiting time';
              item.insertText = new vscode.SnippetString('${1:0}');
              item.sortText = 'z';
              return [item];
            }
            return [];
          case 'DO':
            if (tokens.length === 1) {
              return scripts.map(script => {
                const item = new vscode.CompletionItem(script, vscode.CompletionItemKind.Text);
                item.detail = 'Script (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            }
            return [];
        }
        return undefined;
      }
    },
    ...[' ', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '\n']
  );
  context.subscriptions.push(provider);

  // Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider('gcs', {
    provideHover(document, position) {
      const word = document.getText(document.getWordRangeAtPosition(position));
      if (docs[word]) {
        const md = new vscode.MarkdownString(docs[word]);
        return new vscode.Hover(md);
      }
      return undefined;
    }
  });
  context.subscriptions.push(hoverProvider);

  // Definition Provider with Markdown preview in side column
  const definitionProvider = vscode.languages.registerDefinitionProvider('gcs', {
    provideDefinition(document, position) {
      const wordRange = document.getWordRangeAtPosition(position);
      const word = document.getText(wordRange);
      const docsMap = {
        MOV: 'MOV.md',
        MOVREL: 'MOVREL.md',
        ANI: 'ANI.md',
        WAIT: 'WAIT.md',
        SND: 'SND.md',
        DO: 'DO.md',
        LISTEN: 'LISTEN.md',
        SKIP: 'SKIP.md'
      };

      if (docsMap[word]) {
        const filePath = path.join(docsPath, docsMap[word]);
        const uri = vscode.Uri.file(filePath);

        // Open Markdown preview in side column
        vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
        return null;
      }

      return null;
    }
  });
  context.subscriptions.push(definitionProvider);

  // Diagnostics / Squiggles
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('gcs');
  context.subscriptions.push(diagnosticCollection);

  function updateDiagnostics(doc) {
    if (doc.languageId !== 'gcs') return;

    const diagnostics = [];
    const validCommands = Object.keys(docs);

    for (let line = 0; line < doc.lineCount; line++) {
      const text = doc.lineAt(line).text.trim();
      if (!text) continue;

      const parts = text.split(/\s+/);
      const command = parts[0].toUpperCase();

      if (!validCommands.includes(command)) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(line, 0, line, parts[0].length),
            `Unknown command "${parts[0]}"`,
            vscode.DiagnosticSeverity.Error
          )
        );
        continue;
      }

      let maxParams = 0;
      let minParams = 0;
      switch (command) {
        case 'MOV':
        case 'MOVREL':
        case 'ANI':
        case 'SND':
        case 'DO':
          maxParams = 1;
          minParams = 1;
          break;
        case 'LISTEN':
          maxParams = 2;
          minParams = 1;
          break;
        case 'WAIT':
        case 'SKIP':
          maxParams = 0;
          minParams = 0;
          break;
      }

      if (parts.length - 1 < minParams) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(line, 0, line, text.length),
            `"${command}" requires at least ${minParams} parameter(s).`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }

      if (parts.length - 1 > maxParams) {
        const extraTextStart = text.indexOf(parts[maxParams + 1]);
        const extraTextEnd = text.length;
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(line, extraTextStart, line, extraTextEnd),
            `"${command}" only accepts ${maxParams} parameter(s). Extra parameter(s) detected.`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Numeric validation
      if (['MOV', 'MOVREL'].includes(command) && parts[1]) {
        const coords = parts[1].split(',');
        coords.forEach((param, i) => {
          if (!isNumeric(param)) {
            const start = text.indexOf(param);
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(line, start, line, start + param.length),
                `"${command}" parameter ${i + 1} must be a number.`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }
        });
      }

      if (command === 'WAIT' && parts[1] && !isNumeric(parts[1])) {
        const start = text.indexOf(parts[1]);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(line, start, line, start + parts[1].length),
            `"WAIT" parameter must be a number.`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      if (command === 'LISTEN' && parts[2] && !isNumeric(parts[2])) {
        const start = text.indexOf(parts[2]);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(line, start, line, start + parts[2].length),
            `"LISTEN" time parameter must be a number.`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }

    diagnosticCollection.set(doc.uri, diagnostics);
  }

  vscode.workspace.onDidOpenTextDocument(updateDiagnostics, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document), null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri), null, context.subscriptions);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
