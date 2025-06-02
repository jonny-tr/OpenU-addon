# Extension Debugging Guide

## 🔍 How to Debug Your Extension

### Step 1: Reload the Extension
1. Go to `edge://extensions/`
2. Find "Keep Alive" extension
3. Click the **Reload** button (🔄) to load the latest compiled code
4. Make sure the extension is **Enabled**

### Step 2: Open Developer Tools

#### Background Script Console:
1. In `edge://extensions/`, find your extension
2. Click **Details**
3. Find **Service worker** section
4. Click **inspect** next to the service worker
5. This opens the background script console

#### Popup Console:
1. Right-click your extension icon in the toolbar
2. Select **Inspect popup**
3. This opens the popup's developer tools

### Step 3: What to Look For

#### In the Background Console:
You should see:
```
🚀 Background script loaded
🚀 Extension installed/updated: install
📊 Initial state: {keepAlive: "Stopped", url: "https://sheilta.apps.openu.ac.il/", consecutiveFailures: 0}
```

When you click Start, you should see:
```
Background received message: {action: "start keepalive", url: "https://..."}
Starting keep-alive with URL: https://...
Keep-alive started with advanced session management
Sending start response: {status: "running", url: "https://...", ...}
Keep-alive ping: 200 - 2025-06-02T...
```

#### In the Popup Console:
You should see:
```
🔧 Popup script loaded and DOM ready
🔧 All DOM elements found: {toggleButton: true, statusElement: true, ...}
Getting status from background script...
Status response received: {status: "stopped", url: "https://...", ...}
```

When you click Start:
```
Button clicked! Current status: Stopped URL: https://...
Sending start keepalive message...
Start response received: {status: "running", url: "https://...", ...}
```

### Step 4: Common Issues and Solutions

#### Issue 1: No Background Console Logs
**Problem**: Background script not loading
**Solution**: 
- Check if manifest.json points to the correct file: `"service_worker": "dist/background.js"`
- Reload the extension
- Check for JavaScript errors in the background console

#### Issue 2: No Popup Console Logs
**Problem**: Popup script not loading
**Solution**:
- Check if popup.html includes: `<script src="dist/popup.js"></script>`
- Check if all DOM elements exist in popup.html
- Reload the extension

#### Issue 3: "Extension error" in popup
**Problem**: Communication between popup and background failed
**Solution**:
- Check background console for errors
- Make sure the message listener is working (should see "Background received message")
- Verify the `return true;` is in the message listener

#### Issue 4: Button doesn't respond
**Problem**: Click event not firing or message not sending
**Solution**:
- Check popup console for "Button clicked!" message
- Verify DOM elements are found correctly
- Check for JavaScript errors

### Step 5: Testing the Keep-Alive Functionality

1. **Start the extension** - Button should change to "Stop"
2. **Check background console** - Should show ping attempts every 4 minutes
3. **Check health indicator** - Should show appropriate emoji (🟢/🟡/🔴)
4. **Visit OpenU website** - Navigate to apps.openu.ac.il to see content script logs

### Step 6: Network Testing

Open Edge DevTools → Network tab:
- You should see periodic HEAD requests to the OpenU URL
- Status should be 200 for successful pings
- If you see 401/403, session management is working

## 🚨 Quick Troubleshooting Checklist

- [ ] Extension is enabled in edge://extensions/
- [ ] Extension was reloaded after building
- [ ] Background console shows startup logs
- [ ] Popup console shows DOM elements found
- [ ] No red errors in either console
- [ ] Button click produces console logs
- [ ] Message communication works between popup and background

## 📋 What to Report if Still Not Working

Please share:
1. Background console logs (full output)
2. Popup console logs (full output)  
3. Any red error messages
4. Whether DOM elements are found correctly
5. Network tab showing any requests being made
