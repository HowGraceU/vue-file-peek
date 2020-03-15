import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {

	const langs = [
		'javascript',
		'typescript',
		'vue',
	]

	let ignoreNextDefinitionSearch = false
	const defProviders = langs.map((lang) =>
		vscode.languages.registerDefinitionProvider(lang, {
			async provideDefinition(document, position, ) {
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
					})

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
							const configPaths = config?.compilerOptions?.paths;
							if (configPaths) {
								Object.entries(configPaths).forEach(([key, value]) => {
									filePaths.push(...(value as string[]).map(v => path.resolve(rootPath, wantPath.replace(key.slice(0, -1), v.slice(0, -1)))))
								})
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
					})

					if (!uri) {
						return [];
					}

					return new vscode.Location(vscode.Uri.file(uri), new vscode.Position(0, 0));
				} catch (e) {
					console.log(e.stack)
				}
			},
		}),
	)

	context.subscriptions.push(...defProviders);
}
