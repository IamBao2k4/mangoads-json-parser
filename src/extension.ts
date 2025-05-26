import * as vscode from 'vscode';
import { JsonParserPanel } from './extension-webview/JsonParserPanel';


export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('mangoads-json-parser.jsonParser', () => {
		JsonParserPanel.createOrShow(context.extensionUri);
	}));
}
export function deactivate() { }
