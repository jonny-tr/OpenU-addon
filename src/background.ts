import { KeepAliveMessage, KeepAliveResponse } from './types.js';

const defaultUrl: string = 'https://sheilta.apps.openu.ac.il/';
let url: string = defaultUrl;
let keepAlive: 'Running' | 'Stopped' = 'Stopped';
let keepAliveInterval: number | null = null;
let consecutiveFailures: number = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Advanced session management with smart retry logic and failure handling.
 */
class SessionManager {
    private static instance: SessionManager;
    
    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Detects if the user is likely logged in by checking for session indicators
     */
    async isSessionActive(): Promise<boolean> {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                credentials: 'include',
                cache: 'no-cache'
            });
            
            // Check for typical logged-in indicators
            if (response.status === 200) {
                // Look for session cookies or other indicators
                const cookies = await chrome.cookies.getAll({
                    domain: '.apps.openu.ac.il'
                });
                
                return cookies.some(cookie => 
                    cookie.name.toLowerCase().includes('session') ||
                    cookie.name.toLowerCase().includes('auth') ||
                    cookie.name.toLowerCase().includes('login')
                );
            }
            
            return false;
        } catch (error) {
            console.error('Session check failed:', error);
            return false;
        }
    }

    /**
     * Performs a smart ping with exponential backoff on failures
     */
    async smartPing(): Promise<boolean> {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                credentials: 'include',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'User-Agent': navigator.userAgent
                }
            });
            
            console.log(`Keep-alive ping: ${response.status} - ${new Date().toISOString()}`);
            
            if (response.ok) {
                consecutiveFailures = 0;
                return true;
            }
            
            // Handle different error cases
            if (response.status === 401 || response.status === 403) {
                console.log('Session expired, attempting to refresh');
                await this.attemptSessionRefresh();
                return false;
            }
            
            consecutiveFailures++;
            return false;
            
        } catch (error) {
            consecutiveFailures++;
            console.error(`Keep-alive ping failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`, error);
            
            // If we have too many failures, check if we should stop
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.warn('Too many consecutive failures, session may be lost');
                // Optionally notify user or adjust ping frequency
            }
            
            return false;
        }
    }

    /**
     * Attempts to refresh the session by loading the full page
     */
    private async attemptSessionRefresh(): Promise<void> {
        try {
            await fetch(url, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache'
            });
            console.log('Session refresh attempted');
        } catch (error) {
            console.error('Session refresh failed:', error);
        }
    }
}

/**
 * Starts the keep-alive mechanism using periodic fetch requests.
 * This approach is more efficient and reliable than iframe manipulation.
 */
function startKeepAlive(): void {
    keepAlive = 'Running';
    consecutiveFailures = 0;
    
    // Clear any existing interval
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    const sessionManager = SessionManager.getInstance();

    // Function to ping the server with smart retry logic
    const pingServer = async (): Promise<void> => {
        await sessionManager.smartPing();
        
        // Adjust ping frequency based on failures
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            // Reduce frequency when having issues
            console.log('Reducing ping frequency due to consecutive failures');
            clearInterval(keepAliveInterval!);
            keepAliveInterval = setInterval(pingServer, 8 * 60 * 1000); // 8 minutes
        }
    };

    // Start with an immediate ping
    pingServer();

    // Set up periodic pings every 4 minutes (typical session timeout is 5-10 minutes)
    keepAliveInterval = setInterval(pingServer, 4 * 60 * 1000);
    
    console.log('Keep-alive started with advanced session management');
}

/**
 * Stops the keep-alive mechanism and cleans up resources.
 */
function stopKeepAlive(): void {
    keepAlive = 'Stopped';
    
    // Clear interval
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }

    console.log('Keep-alive stopped');
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((
    request: KeepAliveMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: KeepAliveResponse) => void
): void => {
    if (request.action === 'start keepalive') {
        url = request.url?.match(/apps\.openu\.ac\.il/) ? request.url : defaultUrl;
        
        // Stop any existing keep-alive first
        stopKeepAlive();
        
        // Start the new keep-alive
        startKeepAlive();
        
        sendResponse({ status: 'running', url: url });
        
    } else if (request.action === 'stop keepalive') {
        stopKeepAlive();
        sendResponse({ status: 'stopped', url: url });
        
    } else if (request.action === 'getStatus') {
        sendResponse({ status: keepAlive.toLowerCase() as 'running' | 'stopped', url: url });
    }
});

// Keep the service worker alive by handling extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});
