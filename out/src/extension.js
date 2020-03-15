"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    const langs = [
        'javascript',
        'typescript',
        'vue',
    ];
    let ignoreNextDefinitionSearch = false;
    const defProviders = langs.map((lang) => vscode.languages.registerDefinitionProvider(lang, {
        provideDefinition(document, position) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const wordRange = document.getWordRangeAtPosition(position);
                    if (!wordRange) {
                        return [];
                    }
                    const word = document.getText(wordRange);
                    const line = document.lineAt(position).text;
                    // console.log('word: ' + word); // 当前光标所在单词
                    // console.log('line: ' + line); // 当前光标所在行
                    const match = [...line.matchAll(new RegExp(`['"]([^'"]*${word}[^'"]*)['"]`, 'g'))].find(m => {
                        const wantPath = m[1];
                        const pathEnd = m.index + wantPath.length + 1;
                        if (wordRange.start.character >= m.index && wordRange.end.character <= pathEnd) {
                            return true;
                        }
                    });
                    if (!match) {
                        return [];
                    }
                    const fileName = document.fileName;
                    const workDir = path.dirname(fileName);
                    const rootPath = vscode.workspace.rootPath;
                    // console.log('fileName: ' + fileName); // 当前文件完整路径
                    // console.log('workDir: ' + workDir); // 当前文件所在目录
                    let wantPath = match[1];
                    const filePaths = [path.resolve(workDir, wantPath)];
                    if (wantPath.startsWith('@/')) {
                        const jsConfig = [path.resolve(rootPath, 'jsconfig.json'), path.resolve(rootPath, 'tsconfig.json')].find(file => fs.existsSync(file));
                        if (jsConfig) {
                            const config = require(jsConfig);
                            const configPaths = (_a = config === null || config === void 0 ? void 0 : config.compilerOptions) === null || _a === void 0 ? void 0 : _a.paths;
                            if (configPaths) {
                                Object.entries(configPaths).forEach(([key, value]) => {
                                    filePaths.push(...value.map(v => path.resolve(rootPath, wantPath.replace(key.slice(0, -1), v.slice(0, -1)))));
                                });
                            }
                        }
                    }
                    let uri = '';
                    filePaths.some(fp => {
                        if (fp.endsWith('.vue') && fs.existsSync(fp)) {
                            uri = fp;
                            return true;
                        }
                        const vuePath = `${fp}.vue`;
                        if (fs.existsSync(vuePath)) {
                            uri = vuePath;
                            return true;
                        }
                        const indexPath = `${fp}/index.vue`;
                        if (fs.existsSync(indexPath)) {
                            uri = indexPath;
                            return true;
                        }
                    });
                    if (!uri) {
                        return [];
                    }
                    return new vscode.Location(vscode.Uri.file(uri), new vscode.Position(0, 0));
                }
                catch (e) {
                    console.log(e.stack);
                }
            });
        },
    }));
    context.subscriptions.push(...defProviders);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map