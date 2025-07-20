import * as assert from 'assert';
import * as vscode from 'vscode';

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
