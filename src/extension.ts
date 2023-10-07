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
	if (node.contextValue === 'filter' ||
	node.contextValue === 'filter_readonly') {
		return node.filter.library;
	}
	else {
		return getLibrary(node.parent);
	}
}
function getSrcf(node:any):String {
	if (node.contextValue === 'filter' ||
		node.contextValue === 'filter_readonly') {
		return '*ALL';
	}
	if (node.contextValue === 'SPF' ||
		node.contextValue === 'SPF_readonly') {
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
function reportResult(header:String, gitResult:CommandResult|undefined) {
	const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
	return vscode.window.showInformationMessage(header.valueOf(), options, ...["Ok"]);

}
function askLibrary(dflt:string):Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Library',
		placeHolder: 'Enter library',
		value: dflt
	});
}
function buildQuickPickListAndSelect(options:String[], which: String):any {
const quickPickItems = options.map(item => {
	if (item === which) {return { label: item, picked: true};}
	else {return {label: item};}
});
}
function askConfirm(confirmWhat:String):Thenable<string|undefined> {
	return window.showQuickPick(['Yes','No'], {
		placeHolder: 'Confirm or reject action',
		title: confirmWhat.valueOf()
	});
}
function askSrcf(dflt:string):Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Source File',
		placeHolder: 'Enter source file',
		value: dflt
	});
}

function askMember(dflt:string):Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Member',
		placeHolder: 'Enter member name',
		value: dflt

	});
}

function askGitLib():Thenable<String|undefined> {
	return window.showInputBox({
		title: "iGit Library",
		placeHolder: "Enter iGit Library to check out to",
		value:"*SAME"
	});
}

function runGitCommandNeedsLib(connection:any, lib:String, command:String):Thenable<CommandResult|undefined> {
	return connection?.runCommand({
		environment: `ile`,
		command: `${command} lib(${lib})`
	});

}

function runGitCommandNoLib(connection:any, command:String):Thenable<CommandResult|undefined> {
	return connection?.runCommand({
		environment: `ile`,
		command: command
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
			lib = await askLibrary("*CURLIB");
		} else {
			lib = getLibrary(node);
		}
		if (lib === undefined ) {
			return await vscode.window.showInformationMessage("iGit command abandoned");
		}
		if (lib.length === 0) {
			return await vscode.window.showErrorMessage("Must provide a library");
		}
		
		let cmd:String;
		if (node === undefined) {
			
			cmd =  `gitstatus info(*${pickResult})`;

		} else {
			switch(node.contextValue) {
				case 'SPF': 
				case 'SPF_readonly': {
					cmd = `gitstatus info(*${pickResult})`;
					break;
				}
				case 'filter':
				case 'filter_readonly': {
					cmd =`gitstatus info(*${pickResult})`;
					break;
				}
				case 'member': 
				case 'member_readonly': {
					cmd =  `gitstatus info(*${pickResult})`;
					break;
				}
				default: {
					cmd = 'gitstatus info(*info)';
					lib = '*NONE';
					break;
				}
			}
		}
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		let result: String | undefined;
		const gitResult = await runGitCommandNeedsLib(connection, lib, `gitstatus info(*${pickResult})`);
		const header = "Git Status";
		await reportResult(header, gitResult);
	});
	let nodeAdd = vscode.commands.registerCommand(`eradani.gitadd`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf("*ALL");
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
			if (srcf.toUpperCase() === "*ALL") {
				cmd = `gitadd file(${lib}/*ALL)`;
			} else {
				member = await askMember("*ALL");
				if (member === undefined || member.length === 0) {
					return;
				}
				cmd =`gitadd file(${lib}/${srcf}) srcmbr(${member})`;
			}
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': 
				case 'filter_readonly': {
					cmd = `gitadd file(${lib}/*ALL) srcmbr(*ALL)`;
					break;
				}
				
				case 'SPF': 
				case 'SPF_readonly': {
					srcf =getSrcf(node);
					cmd = `gitadd file(${lib}/${srcf})`;
					break;
				}
				case 'member': 
				case 'member_readonly': {
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
		const gitResult: CommandResult|undefined = await runGitCommandNoLib(connection, cmd);
		const header = "Git Add";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});

	let nodeSave = vscode.commands.registerCommand(`eradani.gitsave`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf("*ALL");
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
			if (srcf.toUpperCase() === "*ALL") {
				cmd = `gitsave file(${lib}/*ALL)`;
			} else {
				member = await askMember("*ALL");
				if (member === undefined || member.length === 0) {
					return;
				}
				cmd =`gitsave file(${lib}/${srcf}) mbr(${member})`;
			}
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': 
				case 'filter_readonly': {
					cmd = `gitsave file(${lib}/*ALL) mbr(*ALL)`;
					break;
				}
				
				case 'SPF': 
				case 'SPF_readonly':{
					srcf =getSrcf(node);
					cmd = `gitsave file(${lib}/${srcf})`;
					break;
				}
				case 'member': 
				case 'member_readonly':{
					srcf = getSrcf(node);
					member = node.member.name;
					cmd = `gitsave file(${lib}/${srcf}) mbr(${member})`;
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
		const gitResult: CommandResult|undefined = await runGitCommandNoLib(connection, cmd);
		const header = "Git Save";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});
	let nodeCommit = vscode.commands.registerCommand(`eradani.gitcommit`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		let message = await window.showInputBox({
			title: 'Commit Message',
			placeHolder: 'Enter commit message',
			value:""
	
		});
		if (message === undefined)
		{
			return;
		}
		if (message.length === 0) {
			await window.showErrorMessage("Must provide a commit message");
			return;
		}
		cmd = `gitcommit msg('${message}')`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git Commit";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});
	let nodePush = vscode.commands.registerCommand(`eradani.gitpush`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		const confirm = await askConfirm("Confirm Push");

		if (confirm !== 'Yes') {
			return;
		}
		cmd = `gitpush setup(*no)`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git Push";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});

	let nodePushNewBranch = vscode.commands.registerCommand(`eradani.gitpushnewbranch`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		const confirm = await askConfirm("Confirm Push New Branch");

		if (confirm !== 'Yes') {
			return;
		}
		cmd = `gitpush setup(*yes)`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git Push";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});

	let nodePull = vscode.commands.registerCommand(`eradani.gitpull`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		const confirm = await askConfirm("Confirm Pull");

		if (confirm !== 'Yes') {
			return;
		}
		cmd = `gitpull `;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git Pull";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});

	let nodeNewBranch = vscode.commands.registerCommand(`eradani.gitnewbranch`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		let name = await window.showInputBox({
			title: 'New Branch',
			placeHolder: 'Enter new branch name',
			value:""
	
		});
		if (name === undefined)
		{
			return;
		}
		if (name.length === 0) {
			await window.showErrorMessage("Must provide a commit message");
			return;
		}
		cmd = `gitbrnch name(${name}) act(*create) swtch(*yes)`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git New Branch";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});


	let nodeRemove = vscode.commands.registerCommand(`eradani.gitremove`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf("");
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
		
			member = await askMember("");
			if (member === undefined || member.length === 0) {
				return;
			}
			cmd =`gitrm file(${lib}/${srcf}) srcmbr(${member})`;
			
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': {
					srcf = await askSrcf("");
					if (srcf === undefined || srcf.length === 0) {
						return;
					}
				
					member = await askMember("");
					if (member === undefined || member.length === 0) {
						return;
					}
					cmd =`gitrm file(${lib}/${srcf}) srcmbr(${member})`;
					break;
				}
				
				case 'SPF': {
					srcf =getSrcf(node);
					member = await askMember("");
					if (member === undefined || member.length === 0) {
						return;
					}
					cmd =`gitrm file(${lib}/${srcf}) srcmbr(${member})`;
					break;
					break;
				}
				case 'member': {
					srcf = getSrcf(node);
					member = node.member.name;
					cmd = `gitrm file(${lib}/${srcf}) srcmbr(${member})`;
					break;
				}
				default: {
					result = await vscode.window.showInformationMessage(`Type: ${node.contextValue} not a source.`);
					return;
					break;
				}
			}
		}
		if ((await askConfirm(`Remove ${lib}/${srcf} mbr(${member})`)) === 'No') {
			return;
		}
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNoLib(connection, cmd);
		const header = "Git Remove";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});


	let nodeUndo = vscode.commands.registerCommand(`eradani.gitundo`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf("");
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
		
			member = await askMember("");
			if (member === undefined || member.length === 0) {
				return;
			}
			cmd =`gitundo file(${lib}/${srcf}) srcmbr(${member})`;
			
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': 
				case 'filter_readonly': {
					srcf = await askSrcf("");
					if (srcf === undefined || srcf.length === 0) {
						return;
					}
				
					member = await askMember("");
					if (member === undefined || member.length === 0) {
						return;
					}
					cmd =`gitundo file(${lib}/${srcf}) srcmbr(${member})`;
					break;
				}
				
				case 'SPF': 
				case 'SPF_readonly': {
					srcf =getSrcf(node);
					member = await askMember("");
					if (member === undefined || member.length === 0) {
						return;
					}
					cmd =`gitundo file(${lib}/${srcf}) srcmbr(${member})`;
					break;
					break;
				}
				case 'member': 
				case 'member_readon;y': {
					srcf = getSrcf(node);
					member = node.member.name;
					cmd = `gitundo file(${lib}/${srcf}) srcmbr(${member})`;
					break;
				}
				default: {
					result = await vscode.window.showInformationMessage(`Type: ${node.contextValue} not a source.`);
					return;
					break;
				}
			}
		}
		let whichAct = await window.showQuickPick(['Staged','Unstaged', 'Removed', 'Retyped'], {
			placeHolder: 'Select what action to undo',
			title: 'Select action to undo'
		});
		if (whichAct === undefined) {
			return;
		}
		if ((await askConfirm(`Undo of ${whichAct} on  ${lib}/${srcf} mbr(${member})`)) === 'No') {
			return;
		}
		cmd = cmd + ` what(*${whichAct})`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNoLib(connection, cmd);
		const header = "Git Remove";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});

	let nodeSwitch = vscode.commands.registerCommand(`eradani.gitswitch`, async (node) => {
		let lib:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
		} else {
			lib = getLibrary(node);
		}
		let name = await window.showInputBox({
			title: 'Branch',
			placeHolder: 'Enter branch name',
			value:""
	
		});
		if (name === undefined)
		{
			return;
		}
		if (name.length === 0) {
			await window.showErrorMessage("Must provide a commit message");
			return;
		}
		cmd = `gitswitch name(${name})`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNeedsLib(connection, lib, cmd);
		const header = "Git Switch";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result = await vscode.window.showInformationMessage(header, options, ...["Ok"]);

	});

	let nodeCheckout = vscode.commands.registerCommand(`eradani.gitcheckout`, async (node) => {
		let lib:String|undefined;
		let srcf:String|undefined;
		let member:String|undefined;
		let result: String | undefined;
		let cmd: String;
		if (node === undefined) {
			lib = await askLibrary("*CURLIB");
			if (lib === undefined || lib.length ===0) {
				return;
			}
			srcf = await askSrcf("");
			if (srcf === undefined || srcf.length === 0) {
				return;
			}
			if (srcf.toUpperCase() === "*ALL") {
				cmd = `gitadd file(${lib}/*ALL)`;
			} else {
				member = await askMember("");
				if (member === undefined || member.length === 0) {
					return;
				}
				cmd =`gitadd file(${lib}/${srcf}) srcmbr(${member})`;
			}
			

		} else {
			lib = getLibrary(node);
			switch(node.contextValue) {
				case 'filter': 
				case 'filter_readonly': {
					srcf = await askSrcf("");
					if (srcf === undefined) {
						return;
					}
					if (srcf.length === 0) {
						return;
					}
					member = await askMember("");
					if (member === undefined) {
						return;
					}
					if (member.length === 0) {
						return;
					}
					break;
				}
				
				case 'SPF': 
				case 'SPF_readonly':{
					srcf = getSrcf(node);
					member = await askMember("");
					if (member === undefined) {
						return;
					}
					if (member.length === 0) {
						return;
					}
					break;
				}
				case 'member':
				case 'member_readonly': {
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
		
		let gitlib = await askGitLib();
		if (gitlib === undefined) {
			return;
		}
		if (gitlib.length === 0) {
			return;
		}
		cmd = `gitchkout file(${lib}/${srcf}) mbr(${member}) lib(${gitlib})`;
		loadBase();
		let instance = getInstance();
		const connection = instance?.getConnection();
		const ext = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
		const gitResult: CommandResult|undefined = await runGitCommandNoLib(connection, cmd);
		const header = "Git Add";
		const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
		result =await vscode.window.showInformationMessage(header, options, ...["Ok"]);
		
	});
	

	context.subscriptions.push(disposable);
	context.subscriptions.push(nodeCmd);
	context.subscriptions.push(nodeAdd);
	context.subscriptions.push(nodeSave);
	context.subscriptions.push(nodeCommit);
	context.subscriptions.push(nodePush);
	context.subscriptions.push(nodePushNewBranch);
	context.subscriptions.push(nodePull);
	context.subscriptions.push(nodeNewBranch);
	context.subscriptions.push(nodeRemove);
	context.subscriptions.push(nodeUndo);
	context.subscriptions.push(nodeSwitch);
	context.subscriptions.push(nodeCheckout);
		
}

// This method is called when your extension is deactivated
export function deactivate() {}
