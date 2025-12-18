const vscode = require('vscode');
const path = require('path');

function activate(context) {
  console.log('GCS Language extension is now active!');

  const docsPath = path.join(__dirname, 'docs');

  // Commands / metadata used for completion and help
  const commands = [
    { label: 'MOV', detail: 'Moves the actor to absolute coordinates: `MOV x,y`' },
    { label: 'MOVREL', detail: 'Move actor relative to current position: `MOVREL x,y`' },
    { label: 'ANI', detail: 'Changes the current animation: `ANI JUMP`' },
    { label: 'WAIT', detail: 'Pauses execution for given amount of seconds: `WAIT 1`' },
    { label: 'SND', detail: 'Sends one message to the Stage MessageDispatcher: `SND OK`' },
    { label: 'DO', detail: 'Executes another script: `DO SCRIPT_2`' },
    { label: 'LISTEN', detail: 'Awaits for a message and then proceeds (optional maximum waiting time, separated by comma): `LISTEN OK,10`' },
    { label: 'SKIP', detail: 'Skips one frame: `SKIP`' },
    { label: 'TELL', detail: 'Tells a story: `TELL STORY_NAME`' },
    { label: 'SAY', detail: 'Says a line of dialogue: `SAY "Your text here"`' } // Added SAY
  ];

  const animations = ['IDLE', 'WALK', 'ATTACK'];
  const messages = ['HIT_EVENT', 'ATTACK', 'END_SCENE'];
  const scripts = ['INTRO', 'CUTSCENE1', 'BOSS_BATTLE'];
  const stories = ['INTRO', 'CHAPTER1', 'ENDING']; // Example stories

  const docs = {
    MOV: 'Moves the actor to absolute coordinates: `MOV x,y`',
    MOVREL: 'Move actor relative to current position: `MOVREL x,y`',
    ANI: 'Changes the current animation: `ANI JUMP`',
    WAIT: 'Pauses execution for given amount of seconds: `WAIT 1`',
    SND: 'Sends one message to the Stage MessageDispatcher: `SND OK`',
    DO: 'Executes another script: `DO SCRIPT_2`',
    LISTEN: 'Awaits for a message and then proceeds (optional maximum waiting time, separated by comma): `LISTEN OK,10`',
    SKIP: 'Skips one frame: `SKIP`',
    TELL: 'Tells a story: `TELL STORY_NAME`',
    SAY: 'Says a line of dialogue: `SAY "Your text here"`'
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
            } else if (cmd.label === 'SAY') {
              item.insertText = new vscode.SnippetString('SAY "${1:Your text here}"');
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
            } else if (tokens.length === 2 && !tokens[1].includes(',')) {
              const item = new vscode.CompletionItem('time', vscode.CompletionItemKind.Value);
              item.insertText = new vscode.SnippetString(',${1:0}');
              item.detail = 'Maximum waiting time (numeric, optional, separated by comma)';
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

          case 'TELL':
            if (tokens.length === 1) {
              return stories.map(story => {
                const item = new vscode.CompletionItem(story, vscode.CompletionItemKind.Text);
                item.detail = 'Story name (suggestion)';
                item.insertText = undefined;
                item.sortText = 'z';
                return item;
              });
            }
            return [];

          case 'SAY':
            if (tokens.length === 1) {
              const item = new vscode.CompletionItem('text', vscode.CompletionItemKind.Snippet);
              item.insertText = new vscode.SnippetString('SAY "${1:Your text here}"');
              item.detail = 'Insert dialogue text';
              return [item];
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

      switch (command) {
        case 'MOV':
        case 'MOVREL':
          if (!/^-?\d+\s*,\s*-?\d+$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"${command}" requires two numeric parameters separated by a comma (e.g. ${command} 10,20 or ${command} -5, 15).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'WAIT':
          if (!/^\s*\d+(\.\d+)?\s*$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"WAIT" requires one numeric parameter (e.g. WAIT 5).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'LISTEN':
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
          if (!/^[A-Z_0-9]+$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"${command}" requires exactly one identifier (letters, digits, and underscores only).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'TELL':
          if (!/^[A-Z_][A-Z0-9_]*$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"TELL" requires exactly one STORY identifier (letters, digits, and underscores only).`,
              vscode.DiagnosticSeverity.Error
            ));
          }
          break;

        case 'SAY':
          if (!/^".*"$/.test(argText)) {
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(line, 0, line, raw.length),
              `"SAY" requires a string parameter enclosed in double quotes (e.g. SAY "Hello world").`,
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

  // ---------- Decorations ----------
  const functionDecoration = vscode.window.createTextEditorDecorationType({ textDecoration: 'none' });

  function updateFunctionDecorations(editor) {
    if (!editor || editor.document.languageId !== 'gcs') return;

    const regEx = /^(MOV|MOVREL|ANI|WAIT|SND|DO|LISTEN|SKIP|TELL|SAY)/gmi;
    const text = editor.document.getText();
    const decorations = [];

    let match;
    while ((match = regEx.exec(text))) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      decorations.push({
        range: new vscode.Range(startPos, endPos),
        hoverMessage: `Open docs for **${match[0].toUpperCase()}** (Ctrl+Click)`
      });
    }

    editor.setDecorations(functionDecoration, decorations);
  }

  vscode.window.onDidChangeActiveTextEditor(updateFunctionDecorations, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(e => {
    if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
      updateFunctionDecorations(vscode.window.activeTextEditor);
    }
  }, null, context.subscriptions);

  if (vscode.window.activeTextEditor) updateFunctionDecorations(vscode.window.activeTextEditor);

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
        vscode.commands.executeCommand('gcs.openDoc', word);
      }
    }
  });
}

function deactivate() { }

module.exports = { activate, deactivate };
