# MangoAds JSON Parser VS Code Extension

This extension allows you to open, view, edit, and save JSON files with a user-friendly form interface directly inside Visual Studio Code.

## Features

- Open and parse JSON files visually.
- Edit JSON objects and arrays in a form-based UI.
- Save changes directly to the original file or export as a new JSON file.
- Supports nested objects and arrays.
- Error handling for invalid JSON.

## Getting Started

### Installation

1. Clone this repository:
    ```sh
    git clone <your-repo-url>
    ```
2. Open the folder in VS Code.
3. Run `npm install` to install dependencies.
4. Press `F5` to launch the extension in a new Extension Development Host window.

### Usage

1. Open the command palette (`Ctrl+Shift+P`).
2. Run the command: **"HelloWorld"** (or your registered command).
3. Select a JSON file to open.
4. Edit the JSON data in the form.
5. Click **"Lưu dữ liệu"** to save changes.

## Development

- Main extension code: `src/extension-webview/JsonParserPanel.ts`
- Webview UI logic: `out/compiled/jsonParser.js`
- Static assets: `media/`

### Build

```sh
npm run compile
```

## License

MIT

---

**Author:** MangoAds Team