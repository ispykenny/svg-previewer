# SVG Previewer

A VS Code/Cursor extension that provides SVG preview functionality when hovering over SVG markup in your code.

## Features

- **Hover Preview**: Hover over SVG markup to see a live preview of the SVG
- **Support for Multiple File Types**: Works with HTML, XML, and SVG files
- **Standalone SVG Elements**: Also previews individual SVG elements like `<circle>`, `<rect>`, `<path>`, etc.
- **Context Menu**: Right-click to open a detailed SVG preview in a separate panel
- **Code Display**: Shows both the preview and the SVG code

## How to Use

### Hover Preview

1. Open a file containing SVG markup (HTML, XML, or SVG)
2. Hover your cursor over any SVG content
3. A tooltip will appear showing the SVG preview and code

### Detailed Preview

1. Place your cursor on SVG markup
2. Right-click and select "Show SVG Preview" from the context menu
3. A new panel will open with a larger preview and the SVG code

## Supported SVG Elements

The extension recognizes and can preview:

- Complete `<svg>` elements
- Individual SVG elements:
  - `<circle>`
  - `<rect>`
  - `<path>`
  - `<line>`
  - `<polyline>`
  - `<polygon>`
  - `<ellipse>`
  - `<text>`
  - `<g>`
  - `<defs>`
  - `<use>`

## Example

```html
<!-- Hover over this to see a preview -->
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>
```

## Development

### Prerequisites

- Node.js (version 16 or higher)
- npm

### Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code

### Testing

- Run `npm run test` to execute tests
- Press F5 in VS Code to launch the extension in a new Extension Development Host window

### Building

- Run `npm run compile` to build the extension
- The compiled files will be in the `out/` directory

## Installation

### From Source

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Copy the extension to your VS Code extensions folder or use the Extension Development Host

### From VSIX (when published)

1. Download the .vsix file
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Select the downloaded file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### 0.0.1

- Initial release
- Hover preview functionality
- Support for HTML, XML, and SVG files
- Context menu integration
- Webview panel for detailed previews
