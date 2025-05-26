import * as vscode from "vscode";
import { getNonce } from "./getNonce";

export class JsonParserPanel {
    public static currentPanel: JsonParserPanel | undefined;

    public static readonly viewType = "hello-world";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static async createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (JsonParserPanel.currentPanel) {
            JsonParserPanel.currentPanel._panel.reveal(column);
            JsonParserPanel.currentPanel._update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            JsonParserPanel.viewType,
            "HelloWorld",
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.joinPath(extensionUri, "out/compiled"),
                ],
            }
        );

        JsonParserPanel.currentPanel = new JsonParserPanel(panel, extensionUri);

        // After creating the panel, prompt for file
        const files = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { "JSON files": ["json"] }
        });
        if (files && files[0]) {
            const fileUri = files[0];
            const content = (await vscode.workspace.fs.readFile(fileUri)).toString();
            panel.webview.postMessage({
                type: "loadJson",
                value: content,
                filePath: fileUri.fsPath
            });
        }
    }

    public static kill() {
        JsonParserPanel.currentPanel?.dispose();
        JsonParserPanel.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        JsonParserPanel.currentPanel = new JsonParserPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        JsonParserPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case "saveJson": {
                    if (!data.value) {
                        return;
                    }
                    console.log("Saving JSON:", data);
                    const filePath = data.inputPath;
                    const jsonContent = JSON.stringify(data.value, null, 2);

                    if (filePath) {
                        try {
                            await vscode.workspace.fs.writeFile(
                                vscode.Uri.file(filePath),
                                Buffer.from(jsonContent, "utf8")
                            );
                            vscode.window.showInformationMessage(
                                `JSON saved to ${filePath}`
                            );
                        } catch (error) {
                            vscode.window.showErrorMessage(
                                `Failed to save JSON: ${error}`
                            );
                        }
                    } else {
                        // If no file path is provided, show a save dialog
                        const options: vscode.SaveDialogOptions = {
                            defaultUri: vscode.Uri.file("output.json"),
                            filters: {
                                "JSON files": ["json"],
                            },
                        };
                        const uri = await vscode.window.showSaveDialog(options);
                        if (uri) {
                            try {
                                await vscode.workspace.fs.writeFile(
                                    uri,
                                    Buffer.from(jsonContent, "utf8")
                                );
                                vscode.window.showInformationMessage(
                                    `JSON saved to ${uri.fsPath}`
                                );
                            } catch (error) {
                                vscode.window.showErrorMessage(
                                    `Failed to save JSON: ${error}`
                                );
                            }
                        }
                    }
                    break;
                }

            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out/compiled", "jsonParser.js")
        );

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );
        // const cssUri = webview.asWebviewUri(
        //   vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.css")
        // );

        // // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
        </script>
		</head>
        <body>
        <label for="input">Choose a JSON file:</label>
        <input type="file" id="input" accept=".json">

        <pre id="output"></pre>
	    </body>
        <script src="${scriptUri}" nonce="${nonce}">
		</html>`;
    }
}
