import * as vscode from 'vscode';
import type { CodeForIBMi } from '@halcyontech/vscode-ibmi-types';
import type { CommandResult } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/api/Instance";
import { Extension, extensions } from "vscode";
import { window, commands, ExtensionContext } from "vscode";

export function getLibrary(node:any):String {
	if (node.contextValue === 'filter') {
		return node.filter.library;
	}
	else {
		return getLibrary(node.parent);
	}
}

export function getSrcf(node:any):String {
	if (node.contextValue === 'filter') {
		return '*ALL';
	}
	if (node.contextValue === 'SPF') {
		return node.file;
	}
	else {
		return getSrcf(node.parent);
	}
}
function stripMessageIds(msg:String):String {
	// read line by line and remove up to : if GIT1004 or GIT1003 is the start
return "";
}
export function reportResult(header:String, gitResult:CommandResult) {
	const options: vscode.MessageOptions = {detail: `${gitResult?.stdout} \n ${gitResult?.stderr}`, modal: true};
	return vscode.window.showInformationMessage(header.valueOf(), options, ...["Ok"]);

}
export function askLibrary():Thenable<String|undefined> {
	return window.showInputBox({
		title: 'Library',
		placeHolder: 'Enter library',
		value: "*CURLIB"
	});
}

export function runGitCommand(connection:any, lib:String, command:String):Thenable<CommandResult|undefined> {
	return connection?.runCommand({
		environment: `ile`,
		command: `${command} lib(${lib})`
	});

}
