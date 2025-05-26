import * as vscode from 'vscode';
import { JsonParserPanel } from './extension-webview/JsonParserPanel';


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('mangoads-json-parser.jsonParser', async (fileUri: vscode.Uri | undefined) => {
            if (!fileUri) {
                vscode.window.showErrorMessage('Please right-click a JSON file in the Explorer and select "Json Parser".');
                return;
            }
            if (fileUri.fsPath.endsWith('.json')) {
                const fileContent = (await vscode.workspace.fs.readFile(fileUri)).toString();
                const panel = JsonParserPanel.createOrShow(context.extensionUri);
				panel.webview.postMessage({
					type: 'loadJson',
					value: fileContent,
					filePath: fileUri.fsPath
				});
            } else {
                vscode.window.showErrorMessage('Please select a JSON file.');
            }
        })
    );
}
export function deactivate() { }
