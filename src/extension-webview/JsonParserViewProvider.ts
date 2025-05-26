import * as vscode from "vscode";
import { getNonce } from "./getNonce";

export class JsonParserViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "mangoadsJsonParserView";
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
                vscode.Uri.joinPath(this._extensionUri, 'out/compiled')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "saveJson": {
                    // ... giữ nguyên logic lưu file như cũ ...
                    break;
                }
                case "pickJsonFile": {
                    const files = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { "JSON files": ["json"] }
                    });
                    if (files && files[0]) {
                        const fileUri = files[0];
                        const content = (await vscode.workspace.fs.readFile(fileUri)).toString();
                        webviewView.webview.postMessage({
                            type: "loadJson",
                            value: content,
                            filePath: fileUri.fsPath
                        });
                    }
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out/compiled", "jsonParser.js")
        );
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${stylesResetUri}" rel="stylesheet">
    <link href="${stylesMainUri}" rel="stylesheet">
</head>
<body>
    <label for="input">Choose a JSON file:</label>
    <button id="input">Chọn file JSON</button>
    <pre id="output"></pre>
</body>
<script src="${scriptUri}" nonce="${nonce}"></script>
</html>`;
    }
}