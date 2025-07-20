"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('svg-previewer'));
    });
    test('Should activate', async () => {
        const extension = vscode.extensions.getExtension('svg-previewer');
        if (extension) {
            await extension.activate();
            assert.ok(true);
        }
    });
});
//# sourceMappingURL=extension.test.js.map