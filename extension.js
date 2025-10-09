const vscode = require('vscode');
const path = require('path');

function activate(context) {
  console.log('GCS Language extension is now active!');

  const docsPath = path.join(__dirname, 'docs');

  // Commands / metadata used for completion and help
  const commands = [
    { label: 'MOV', detail: 'Moves the actor to absolute coordinates: `MOV x,y`' },
    { label: 'MOVREL', detail: 'Move actor relative to current position' },
    { label: 'ANI', detail: 'Changes the current animation' },
    { label: 'WAIT', detail: 'Pauses execution for given amount of seconds' },
    { label: 'SND', detail: 'Sends one message to the Stage MessageDispatcher' },
    { label: 'DO', detail: 'Executes another script' },
    { label: 'LISTEN', detail: 'Awaits for a message and then proceeds (optional maximum waiting time, separated by comma)' },
    { label: 'SKIP', detail: 'Skips one frame' }
  ];

  const animations = ['IDLE', 'WALK', 'ATTACK'];
  const messages = ['HIT_EVENT', 'ATTACK', 'END_SCENE'];
  const scripts = ['INTRO', 'CUTSCENE1', 'BOSS_BATTLE'];

  const docs = {
    MOV: 'Moves the actor to absolute coordinates: `MOV x,y`',
    MOVREL: 'Moves the actor relative to current position',
    ANI: 'Changes the current animation',
    WAIT: 'Pauses execution for given amount of seconds',
    SND: 'Sends one message to the Stage MessageDispatcher',
    DO: 'Executes another script',
    LISTEN: 'Awaits for a message and then proceeds (optional maximum waiting time, separated by comma)',
    SKIP: 'Skips one frame'
  };

  // ---------- Completion Provider ----------
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    { language: 'gcs' },
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position);
        const text = line.text;
        const tokens = text.trim().split(/\s+/);
        const commandTyped = tokens[0] ? tokens[0].toUpperCase() : '';
        const cursorIndex = position.character;

        // Suggest commands at start of line
        if (!commandTyped || cursorIndex <= (tokens[0] ? tokens[0].length : 0)) {
          return commands.map(cmd => {
            const item = new vscode.CompletionItem(cmd.label, vscode.CompletionItemKind.Keyword);
            item.detail = cmd.detail;
            if (cmd.label === 'MOV' || cmd.label === 'MOVREL') {
              item.insertText = new vscode.SnippetString(`${cmd.label} \${1:x},\${2:y}`);
            } else {
              item.insertText = undefined; // soft suggestion
              item.kind = vscode.CompletionItemKind.Text;
              item.sortText = 'z';
            }
            return item;
          });
        }

        // Suggest parameters depending on first command
        switch (commandTyped) {
          case 'MOV':
          case 'MOVREL':
            if (tokens.length === 1) {
              return [new vscode.CompletionItem('x,y', vscode.CompletionItemKind.Value)];
            }
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

          case 'LISTEN': {
            if (tokens.length === 1) {
              return messages.map(msg => {
                const item = new vscode.CompletionItem(msg, vscode.CompletionItemKind.Text);
                item.detail = 'Message (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            } else if (tokens.length === 2 && !tokens[1].includes(',')) {
              const item = new vscode.CompletionItem('time', vscode.CompletionItemKind.Value);
              item.insertText = new vscode.SnippetString(',${1:0}');
              item.detail = 'Maximum waiting time (numeric, optional, separated by comma)';
              return [item];
            }
            return [];
          }

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
  ));

  // ---------- Hover Provider ----------
  context.subscriptions.push(vscode.languages.registerHoverProvider('gcs', {
    provideHover(document, position) {
      const wr = document.getWordRangeAtPosition(position);
      if (!wr) return undefined;
      const word = document.getText(wr).toUpperCase();
      if (docs[word]) return new vscode.Hover(new vscode.MarkdownString(docs[word]));
      return undefined;
    }
  }));

  // ---------- Diagnostics ----------
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('gcs');
  context.subscriptions.push(diagnosticCollection);

  function updateDiagnostics(doc) {
    if (doc.languageId !== 'gcs') return;
    const diagnostics = [];
    const validCommands = Object.keys(docs);

    for (let line = 0; line < doc.lineCount; line++) {
      const raw = doc.lineAt(line).text;
      const text = raw.trim();
      if (!text) continue;

      const parts = text.split(/\s+/);
      const command = parts[0].toUpperCase();
      const argText = text.slice(parts[0].length).trim();

      if (!validCommands.includes(command)) {
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(line, 0, line, parts[0].length),
          `Unknown command "${parts[0]}"`,
          vscode.DiagnosticSeverity.Error
        ));
        continue;
      }

      // parameter validation per-command
      switch (command) {
        case 'MOV':
        case 'MOVREL':
          // allow optional minus signs, optional spaces around comma
          if (!/^-?\d+\s*,\s*-?\d+$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"${command}" requires two numeric parameters separated by a comma (e.g. ${command} 10,20 or ${command} -5, 15).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'WAIT':
          // allow integer or float numbers, optional spaces
          if (!/^\s*\d+(\.\d+)?\s*$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"WAIT" requires one numeric parameter (e.g. WAIT 5).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'LISTEN':
          // message [,time] — allow digits, underscores, optional spaces
          if (!/^[A-Z_0-9]+(\s*,\s*\d+)?$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"LISTEN" requires a message and optionally one numeric time parameter separated by a comma (e.g. LISTEN HIT_EVENT,5).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'ANI':
        case 'SND':
        case 'DO':
          // allow underscores, letters, and digits
          if (!/^[A-Z_0-9]+$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"${command}" requires exactly one identifier (letters, digits, and underscores only).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'SKIP':
          if (argText.trim().length > 0) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, parts[0].length, line, raw.length),
              `"SKIP" does not take any parameters.`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;
      }
    }

    diagnosticCollection.set(doc.uri, diagnostics);
  }

  vscode.workspace.onDidOpenTextDocument(updateDiagnostics, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document), null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri), null, context.subscriptions);

  // ---------- Decorations instead of DocumentLink ----------
  const functionDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: 'none', // no underline
  });

  function updateFunctionDecorations(editor) {
    if (!editor || editor.document.languageId !== 'gcs') return;

    const regEx = /^(MOV|MOVREL|ANI|WAIT|SND|DO|LISTEN|SKIP)/gmi;
    const text = editor.document.getText();
    const decorations = [];

    let match;
    while ((match = regEx.exec(text))) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);

      const range = new vscode.Range(startPos, endPos);
      const decoration = {
        range,
        hoverMessage: `Open docs for **${match[0].toUpperCase()}** (Ctrl+Click)`
      };
      decorations.push(decoration);
    }

    editor.setDecorations(functionDecoration, decorations);
  }

  vscode.window.onDidChangeActiveTextEditor(updateFunctionDecorations, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(e => {
    if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
      updateFunctionDecorations(vscode.window.activeTextEditor);
    }
  }, null, context.subscriptions);

  if (vscode.window.activeTextEditor) {
    updateFunctionDecorations(vscode.window.activeTextEditor);
  }

  // ---------- Command to open docs ----------
  context.subscriptions.push(vscode.commands.registerCommand('gcs.openDoc', (cmd) => {
    if (!cmd) return;
    const mdPath = path.join(docsPath, `${cmd}.md`);
    const mdUri = vscode.Uri.file(mdPath);
    vscode.commands.executeCommand('markdown.showPreviewToSide', mdUri);
  }));

  // ---------- Intercept Ctrl+Click ----------
  vscode.window.onDidChangeTextEditorSelection(e => {
    const editor = e.textEditor;
    if (!editor || editor.document.languageId !== 'gcs') return;
    if (!e.kind || e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) return;

    if (e.selections.length > 0 && e.selections[0].isEmpty) {
      const position = e.selections[0].active;
      const wordRange = editor.document.getWordRangeAtPosition(position, /^[A-Z]+/i);
      if (!wordRange) return;

      const word = editor.document.getText(wordRange).toUpperCase();
      if (docs[word]) {
        // Only trigger if Ctrl (or Cmd on Mac) is pressed
        if (process.platform === 'darwin' ? e.selections[0].isEmpty : e.selections[0].isEmpty) {
          vscode.commands.executeCommand('gcs.openDoc', word);
        }
      }
    }
  });
}

function deactivate() { }

module.exports = { activate, deactivate };
