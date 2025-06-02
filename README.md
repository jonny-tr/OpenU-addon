# OpenU Chromium Extension
A Chromium extension for the OpenU website that just makes it better.

## Development

This project is written in TypeScript.

### Prerequisites
- Node.js and npm

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript files:
   ```bash
   npm run build
   ```

3. For development with auto-compilation:
   ```bash
   npm run dev
   ```

### Project Structure
```
project-root/
├── src/
│   ├── background.ts      # Service worker script
│   ├── content.ts         # Content injected into web pages
│   ├── popup.ts          # Popup UI logic
│   └── types.ts          # Shared interfaces
├── dist/                 # Compiled files
├── popup.html            # Extension popup UI
├── manifest.json         # Extension manifest
└── README.md
```

### Building
The TypeScript files in `src/` are compiled to JavaScript in `dist/`. The manifest and HTML files reference the compiled JavaScript files.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome, feel free to submit a Pull Request.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Guidelines
- Follow the existing code style
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed