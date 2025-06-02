# OpenU Chromium Extension
A Chromium extension for the OpenU website that just makes it better.

## Features

### Advanced Session Management
- **Smart Keep-Alive**: Prevents session timeouts with intelligent ping frequency
- **Session Detection**: Monitors login state and cookie presence
- **Failure Recovery**: Exponential backoff and automatic session refresh
- **Resource Efficient**: Uses lightweight HEAD requests instead of iframe manipulation

### Enhanced User Interface
- **Health Indicators**: Visual status with colored indicators (🟢🟡🔴)
- **Real-time Updates**: Live status monitoring with detailed information
- **Error Handling**: Graceful error recovery and user feedback
- **Auto-refresh**: Status updates every 30 seconds when active

### Content Script Intelligence
- **Domain Detection**: Only activates on OpenU domains
- **Visibility Handling**: Restarts when page becomes visible
- **Smart URL Tracking**: Uses current page URL for better session management

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
│   ├── background.ts       # Advanced service worker with SessionManager
│   ├── content.ts          # Smart content script with domain detection
│   ├── popup.ts            # Enhanced popup UI with health indicators
│   └── types.ts            # Shared TypeScript interfaces
├── dist/                   # Compiled JavaScript files
├── assets/                 # Static assets (icons, styles)
├── popup.html              # Extension popup UI
├── manifest.json           # Extension manifest
├── LICENSE                 # License file
└── README.md               # Project README
```  
│   ├── background.ts      # Advanced service worker with SessionManager
│   ├── content.ts         # Smart content script with domain detection
│   ├── popup.ts          # Enhanced popup UI with health indicators
│   └── types.ts          # Shared TypeScript interfaces
├── dist/                 # Compiled files
├── popup.html            # Extension popup UI with modern styling
├── popup-preview.html    # Preview version for development testing
├── manifest.json         # Extension manifest
├── FRONTEND_ENHANCEMENT.md  # Documentation of UI enhancements
└── README.md
```

### Testing the Extension
1. Load the extension in Chrome/Edge Developer Mode
2. Visit any OpenU website (apps.openu.ac.il)
3. Click the extension icon to see the enhanced popup
4. Monitor the health indicators for session status

For UI development and testing:
```bash
# Open the preview version
start popup-preview.html
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