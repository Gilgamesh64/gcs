# GCS Language for VS Code

**Version:** 1.0.0  
**Author:** Gilgamesh64  

A **Visual Studio Code extension** for editing **GCS scripts** with full language support: syntax highlighting, autocompletion, hover documentation, squiggles, and integrated Markdown documentation.

---

## Features

- Syntax highlighting for keywords and parameters
- Autocomplete for commands and parameters
- Hover documentation for quick descriptions
- Ctrl+Click opens full Markdown docs in side preview
- Diagnostics with squiggles for invalid usage

---

## Commands and Documentation Links

| Command | Description | Documentation |
|---------|-------------|---------------|
| `MOV` | Moves the actor to absolute coordinates | [MOV.md](docs/MOV.md) |
| `MOVREL` | Moves actor relative to current position | [MOVREL.md](docs/MOVREL.md) |
| `ANI` | Changes the current animation | [ANI.md](docs/ANI.md) |
| `WAIT` | Pauses execution | [WAIT.md](docs/WAIT.md) |
| `SND` | Sends a message | [SND.md](docs/SND.md) |
| `DO` | Executes another script | [DO.md](docs/DO.md) |
| `LISTEN` | Waits for a message with optional timeout | [LISTEN.md](docs/LISTEN.md) |
| `SKIP` | Skips one frame | [SKIP.md](docs/SKIP.md) |

> Click any link to open the full documentation in VS Code.

---

## Installation

1. Clone the repository or download the `.vsix` file.
2. Open VS Code → **Extensions → Install from VSIX...**
3. Select the `.vsix` file.
4. Open a `.gcs` file to start using the extension.

---

## Usage

- Type a command like `MOV` and press **Tab** to insert a snippet with arguments.
- Hover over commands to see a short description.
- Press **Ctrl+Click** on a command to open full Markdown documentation in the side panel.
- Invalid usage shows **squiggles**.

---

## Local Documentation

All Markdown docs are located in the `docs` folder:

docs/
├─ MOV.md
├─ MOVREL.md
├─ ANI.md
├─ WAIT.md
├─ SND.md
├─ DO.md
├─ LISTEN.md
├─ SKIP.md

Each file contains **usage examples, parameters, and notes** for developers.

---

## Contributing

- Add new commands or enhance documentation.  
- Keep consistency with numeric checks, autocomplete, hover, and squiggles.

---

## License

MIT License
