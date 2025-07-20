import * as vscode from 'vscode';

let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  console.log('Extension activation started');

  try {
    // Show activation message
    vscode.window.showInformationMessage(
      'SVG Previewer extension is now active!'
    );
    console.log('Notification sent');

    // Register hover provider for SVG content
    const hoverProvider = vscode.languages.registerHoverProvider(
      ['html', 'xml', 'svg'],
      new SVGHoverProvider()
    );

    // Register command to show SVG preview
    const showPreviewCommand = vscode.commands.registerCommand(
      'svg-previewer.showPreview',
      showSVGPreview
    );

    // Register test command
    const testCommand = vscode.commands.registerCommand(
      'svg-previewer.hello',
      () => {
        console.log('Command executed');
        vscode.window.showInformationMessage('Hello from SVG Previewer!');
      }
    );

    context.subscriptions.push(hoverProvider, showPreviewCommand, testCommand);
    console.log('Extension activated successfully');
  } catch (error) {
    console.error('Error during activation:', error);
    vscode.window.showErrorMessage('Extension activation failed: ' + error);
  }
}

class SVGHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    console.log(`Hover at position: ${position.line}:${position.character}`);

    // Check if the hovered text contains SVG content
    const svgMatch = this.findSVGContent(document, position);
    if (!svgMatch) {
      console.log('No SVG content found at this position');
      return null;
    }

    console.log(
      'SVG content found:',
      svgMatch.svgContent.substring(0, 50) + '...'
    );

    const { svgContent, svgRange } = svgMatch;

    // Create hover content with SVG preview
    const hoverContent = new vscode.MarkdownString();
    hoverContent.appendMarkdown('### SVG Preview\n\n');

    // Try to render the SVG directly in the hover
    const cleanSvg = svgContent
      .replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
      .replace(/width="[^"]*"/g, 'width="150"')
      .replace(/height="[^"]*"/g, 'height="150"');

    hoverContent.appendMarkdown(
      `<div style="background: white; padding: 15px; border: 1px solid #ccc; border-radius: 6px; margin: 10px 0; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 10px;">
          <label style="color: #333; font-size: 12px; margin-right: 8px;">Background:</label>
          <input type="color" value="#ffffff" style="width: 30px; height: 20px; border: 1px solid #ccc; border-radius: 3px;" onchange="this.parentElement.parentElement.style.background=this.value">
        </div>
        ${cleanSvg}
      </div>\n\n`
    );

    hoverContent.appendMarkdown('*SVG Preview (hover to see)*\n\n');

    // Add the SVG code in a code block
    hoverContent.appendMarkdown('```svg\n');
    hoverContent.appendMarkdown(svgContent);
    hoverContent.appendMarkdown('\n```');

    // Enable HTML rendering in the hover
    hoverContent.isTrusted = true;
    hoverContent.supportHtml = true;

    return new vscode.Hover(hoverContent, svgRange);
  }

  private findSVGContent(
    document: vscode.TextDocument,
    position: vscode.Position
  ): { svgContent: string; svgRange: vscode.Range } | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Look for SVG tags in the document
    const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
    let match;

    while ((match = svgRegex.exec(text)) !== null) {
      const startOffset = match.index;
      const endOffset = startOffset + match[0].length;

      // Check if the cursor position is within this SVG
      if (offset >= startOffset && offset <= endOffset) {
        const svgContent = match[0];
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        const svgRange = new vscode.Range(startPos, endPos);

        return {
          svgContent,
          svgRange,
        };
      }
    }

    // Also check for standalone SVG elements (like <circle>, <rect>, etc.)
    const svgElementRegex =
      /<(circle|rect|path|line|polyline|polygon|ellipse|text|g|defs|use)[^>]*\/?>/gi;
    while ((match = svgElementRegex.exec(text)) !== null) {
      const startOffset = match.index;
      const endOffset = startOffset + match[0].length;

      if (offset >= startOffset && offset <= endOffset) {
        // Wrap the element in an SVG container for preview
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">${match[0]}</svg>`;
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        const svgRange = new vscode.Range(startPos, endPos);

        return {
          svgContent,
          svgRange,
        };
      }
    }

    return null;
  }
}

async function showSVGPreview() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found');
    return;
  }

  const position = editor.selection.active;
  const document = editor.document;

  const hoverProvider = new SVGHoverProvider();
  const hover = await hoverProvider.provideHover(
    document,
    position,
    new vscode.CancellationTokenSource().token
  );

  if (hover) {
    // Get saved background color preference
    const savedColor = extensionContext.globalState.get(
      'svgPreviewer.backgroundColor',
      '#ffffff'
    );

    // Show the hover content in a new webview
    const panel = vscode.window.createWebviewPanel(
      'svgPreview',
      'SVG Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'saveBackgroundColor':
            extensionContext.globalState.update(
              'svgPreviewer.backgroundColor',
              message.color
            );
            break;
        }
      },
      undefined,
      extensionContext.subscriptions
    );

    const svgMatch = hoverProvider['findSVGContent'](document, position);
    if (svgMatch) {
      panel.webview.html = getWebviewContent(svgMatch.svgContent, savedColor);
    }
  } else {
    vscode.window.showInformationMessage(
      'No SVG content found at cursor position'
    );
  }
}

function getWebviewContent(
  svgContent: string,
  savedColor: string = '#ffffff'
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .controls {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .control-group label {
            font-size: 14px;
            color: var(--vscode-editor-foreground);
        }
        .control-group input {
            padding: 4px 8px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        .preview {
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        }
        .code {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        h1 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .preset-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .preset-btn {
            padding: 4px 12px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 12px;
        }
        .preset-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>SVG Preview</h1>
        
        <div class="controls">
            <div class="control-group">
                <label>Background Color:</label>
                <input type="color" id="bgColor" value="${savedColor}" onchange="updateBackground()">
            </div>
            <div class="control-group">
                <label>SVG Color:</label>
                <input type="color" id="svgColor" value="#000000" onchange="updateSvgColor()">
                <span title="Only affects SVG elements using 'currentColor' (e.g., fill='currentColor', stroke='currentColor')" style="cursor: help; color: var(--vscode-descriptionForeground); font-size: 12px;">ⓘ</span>
            </div>
            <div class="preset-buttons">
                <button class="preset-btn" onclick="setPreset('white')">White</button>
                <button class="preset-btn" onclick="setPreset('black')">Black</button>
                <button class="preset-btn" onclick="setPreset('transparent')">Transparent</button>
                <button class="preset-btn" onclick="setPreset('checkerboard')">Checkerboard</button>
            </div>
        </div>
        
        <div style="font-size: 12px; color: var(--vscode-descriptionForeground); margin: 10px 0; padding: 8px; background: var(--vscode-editor-background); border-radius: 4px; border-left: 3px solid var(--vscode-infoBar-background);">
            💡 <strong>Tip:</strong> SVG Color only affects elements using <code>currentColor</code> (e.g., <code>fill="currentColor"</code>, <code>stroke="currentColor"</code>)
        </div>
        
        <div class="preview" id="preview" style="background: ${savedColor}">
            ${svgContent}
        </div>
        
        <h2>SVG Code:</h2>
        <div class="code">
            <pre><code>${escapeHtml(svgContent)}</code></pre>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function updateBackground() {
            const color = document.getElementById('bgColor').value;
            const preview = document.getElementById('preview');
            preview.style.background = color;
            
            // Save the color preference
            vscode.postMessage({
                command: 'saveBackgroundColor',
                color: color
            });
        }
        
        function updateSvgColor() {
            const color = document.getElementById('svgColor').value;
            const preview = document.getElementById('preview');
            const svg = preview.querySelector('svg');
            
            if (svg) {
                // Set the color on the SVG container to affect currentColor
                svg.style.color = color;
            }
        }
        

        
        function setPreset(type) {
            const preview = document.getElementById('preview');
            const colorInput = document.getElementById('bgColor');
            let colorToSave = '#ffffff';
            
            switch(type) {
                case 'white':
                    preview.style.background = '#ffffff';
                    colorInput.value = '#ffffff';
                    colorToSave = '#ffffff';
                    break;
                case 'black':
                    preview.style.background = '#000000';
                    colorInput.value = '#000000';
                    colorToSave = '#000000';
                    break;
                case 'transparent':
                    preview.style.background = 'transparent';
                    colorInput.value = '#ffffff';
                    colorToSave = 'transparent';
                    break;
                case 'checkerboard':
                    preview.style.background = 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 20px 20px';
                    colorInput.value = '#ffffff';
                    colorToSave = 'checkerboard';
                    break;
            }
            
            // Save the color preference
            vscode.postMessage({
                command: 'saveBackgroundColor',
                color: colorToSave
            });
        }
    </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function deactivate() {
  console.log('SVG Previewer extension is now deactivated!');
}
