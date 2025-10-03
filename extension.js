const vscode = require('vscode');
const path = require('path');

function activate(context) {
  console.log('GCS Language extension is now active!');

  const docsPath = path.join(__dirname, 'docs');

  // Commands
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

  // Completion Provider
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
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
            if (tokens.length === 1) return animations.map(anim => new vscode.CompletionItem(anim, vscode.CompletionItemKind.Text));
            return [];
          case 'SND':
            if (tokens.length === 1) return messages.map(msg => new vscode.CompletionItem(msg, vscode.CompletionItemKind.Text));
            return [];
          case 'LISTEN':
            if (tokens.length === 1) return messages.map(msg => new vscode.CompletionItem(msg, vscode.CompletionItemKind.Text));
            else if (tokens.length === 2 && !tokens[1].includes(',')) {
              const item = new vscode.CompletionItem('time', vscode.CompletionItemKind.Value);
              item.insertText = new vscode.SnippetString(',${1:0}');
              item.detail = 'Maximum waiting time (numeric, optional, separated by comma)';
              return [item];
            }
            return [];
          case 'DO':
            if (tokens.length === 1) return scripts.map(script => new vscode.CompletionItem(script, vscode.CompletionItemKind.Text));
            return [];
        }
        return undefined;
      }
    },
    ...[' ', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '\n']
  ));

  // Hover Provider
  context.subscriptions.push(vscode.languages.registerHoverProvider('gcs', {
    provideHover(document, position) {
      const word = document.getText(document.getWordRangeAtPosition(position));
      if (docs[word]) return new vscode.Hover(new vscode.MarkdownString(docs[word]));
      return undefined;
    }
  }));

  // Diagnostics
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
          if (!/^\d+,\d+$/.test(argText))
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(line, 0, line, text.length), `"${command}" requires two numeric parameters separated by a comma.`, vscode.DiagnosticSeverity.Error));
          break;
        case 'WAIT':
          if (!/^\d+$/.test(argText))
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(line, 0, line, text.length), `"WAIT" requires one numeric parameter.`, vscode.DiagnosticSeverity.Error));
          break;
        case 'LISTEN':
          if (!/^[A-Z_]+(,\d+)?$/.test(argText))
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(line, 0, line, text.length), `"LISTEN" requires a message and optionally one numeric time parameter separated by a comma.`, vscode.DiagnosticSeverity.Error));
          break;
      }
    }

    diagnosticCollection.set(doc.uri, diagnostics);
  }

  vscode.workspace.onDidOpenTextDocument(updateDiagnostics, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document), null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri), null, context.subscriptions);

  // DocumentLink Provider (Ctrl+Click → command link)
  context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(
    { language: 'gcs' },
    {
      provideDocumentLinks(document) {
        const links = [];
        for (let line = 0; line < document.lineCount; line++) {
          const text = document.lineAt(line).text;
          const match = text.match(/^(MOV|MOVREL|ANI|WAIT|SND|DO|LISTEN|SKIP)/);
          if (match) {
            const start = text.indexOf(match[1]);
            const end = start + match[1].length;

            // set a command: URI so no "target is missing"
            const commandUri = vscode.Uri.parse(`command:gcs.openDoc?${encodeURIComponent(JSON.stringify([match[1]]))}`);

            const link = new vscode.DocumentLink(new vscode.Range(line, start, line, end), commandUri);
            link.tooltip = `Open documentation for ${match[1]}`;
            links.push(link);
          }
        }
        return links;
      }
    }
  ));

  // Command to open Markdown preview in side view only
  context.subscriptions.push(vscode.commands.registerCommand('gcs.openDoc', (cmd) => {
    const mdPath = path.join(docsPath, `${cmd}.md`);
    const mdUri = vscode.Uri.file(mdPath);

    // Open preview only
    vscode.commands.executeCommand('markdown.showPreviewToSide', mdUri);
  }));
}

function deactivate() {}

module.exports = { activate, deactivate };
