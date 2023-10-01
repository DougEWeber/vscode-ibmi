// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import type { CodeForIBMi } from '@halcyontech/vscode-ibmi-types';
import type { CommandResult } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/api/Instance";
import { Extension, extensions } from "vscode";
import { window, commands, ExtensionContext } from "vscode";



let baseExtension: Extension<CodeForIBMi>|undefined;

export function loadBase(): CodeForIBMi|undefined {
	if (!baseExtension) {
		baseExtension = (extensions ? extensions.getExtension(`halcyontechltd.code-for-ibmi`) : undefined);
	}
	return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports : undefined);
}

export function getInstance():Instance|undefined {
	return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.instance : undefined);
}

function getLibrary(node:any):String {
	if (node.contextValue === 'filter') {
		return node.filter.library;
	}
	else {
		return getLibrary(node.parent);
	}
}
function getSrcf(node:any):String {
	if (node.contextValue === 'filter') {
		return '*ALL';
	}
	if (node.contextValue === 'SPF') {
		return node.sourceFile.name;
	}
	else {
		return getSrcf(node.parent);
	}
}
function stripMessageIds(msg:String):String {
	// read line by line and remove up to : if GIT1004 or GIT1003 is the start
return "";
}
function reportResult(header:String, gitResult:CommandResult) {
	const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
	return vscode.window.showInformationMessage(header.valueOf(), options, ...["Ok"]);

}
function askLibrary():Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Library',
		placeHolder: 'Enter library',
		value: "*CURLIB"
	});
}
function askSrcf():Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Source File',
		placeHolder: 'Enter source file',
		value: "*ALL"
	});
}

function askMember():Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Member',
		placeHolder: 'Enter member name',
		value:"*ALL"

	});
}

function runGitCommand(connection:any, lib:String, command:String):Thenable<CommandResult|undefined> {
	return connection?.runCommand({
		environment: `ile`,
		command: `${command} lib(${lib})`
	});

}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	loadBase();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "igit" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('igit.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from iGit!');
	});
    let nodeCmd = vscode.commands.registerCommand(`eradani.gitStatus`, async (node: any) => {
		const pickResult = await window.showQuickPick(['Info', 'Normal', 'Branches', 'Tags'], {
			placeHolder: 'Select Type of Status Desired',
			title: 'iGit Status',
		
		});
		var lib:String|undefined = undefined;
		if (node === undefined) {
			/*lib = await window.showInputBox({
				title: 'Library',
				placeHolder: 'Enter library',
				value: "*CURLIB"
			});*/
			lib = await askLibrary();
		} else {
			lib = getLibrary(node);
		}
		if (lib === undefined ) {
			return await vscode.window.showInformationMessage("iGit command abandoned");
		}
		if (lib.length === 0) {
			return await vscode.window.showErrorMessage("Must provide a library");
		}
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		let result: String | undefined;
		if (node === undefined) {
			
			const gitResult = await runGitCommand(connection, lib, `gitstatus info(*${pickResult})`);
			const header = "Git Status";
			result = await reportResult(header, gitResult);

		} else {
			switch(node.contextValue) {
				case 'SPF': {
					result =await vscode.window.showInformationMessage(`Source Physical Lib: ${node.parent.library} File: ${node.file}`);
					break;
				}
				case 'filter': {
					const gitResult: CommandResult|undefined = await runGitCommand(connection, lib, `gitstatus info(*${pickResult})`);
					const header = "Git Status";
					result = await reportResult(header, gitResult);
					break;
				}
				case 'member': {
					const gitResult: CommandResult|undefined = await runGitCommand(connection, lib, `gitstatus info(*${pickResult})`);
					const header = "Git Status";
					result = await reportResult(header, gitResult);
					break;
				}
				default: {
					result = await vscode.window.showInformationMessage(`Type: ${node.contextValue}`);
					break;
				}
			}
		}
	});
	let nodeAdd = vscode.commands.registerCommand(`eradani.gitadd`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary();
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf();
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
			if (srcf.toUpperCase() === "*ALL") {
				cmd = `gitadd file(${lib}/*ALL)`;
			} else {
				member = await askMember();
				if (member === undefined || member.length === 0) {
					return;
				}
				cmd =`gitadd file(${lib}/${srcf}) srcmbr(${member})`;
			}
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': {
					cmd = `gitadd file(${lib}/*ALL) srcmbr(*ALL)`
				}
				
				case 'SPF': {
					srcf =getSrcf(node);
					cmd = `gitadd file(${lib}/${srcf})`;
					break;
				}
				case 'member': {
					srcf = getSrcf(node);
					member = node.member.name;
					cmd = `gitadd file(${lib}/${srcf}) srcmbr(${member})`;
					break;
				}
				default: {
					result = await vscode.window.showInformationMessage(`Type: ${node.contextValue}`);
					return;
					break;
				}
			}
		}
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await connection?.runCommand({
			environment: `ile`,
			command : cmd
		});
		const header = "Git Status";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(nodeCmd);
	context.subscriptions.push(nodeAdd);
}

// This method is called when your extension is deactivated
export function deactivate() {}
