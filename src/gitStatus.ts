import * as vscode from 'vscode';
import type { CodeForIBMi } from '@halcyontech/vscode-ibmi-types';
import type { CommandResult } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/api/Instance";
import { Extension, extensions } from "vscode";
import { window, commands, ExtensionContext } from "vscode";