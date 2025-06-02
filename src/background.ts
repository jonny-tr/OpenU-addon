// Define types inline to avoid module imports
interface KeepAliveMessage {
    action: 'start keepalive' | 'stop keepalive' | 'getStatus' | 'getDetailedStatus';
    url?: string;
}

interface KeepAliveResponse {
    status: 'running' | 'stopped';
    url: string;
    consecutiveFailures?: number;
    sessionActive?: boolean;
    lastPing?: string;
}

interface DetailedStatusResponse extends KeepAliveResponse {
    consecutiveFailures: number;
    sessionActive: boolean;
    lastPing: string;
    pingFrequency: number; // in minutes
}

interface StartKeepAliveMessage {
    action: 'start keepalive';
    url: string;
}

console.log('Background script loaded');

const defaultUrl: string = 'https://sheilta.apps.openu.ac.il/';
let url: string = defaultUrl;
let keepAlive: 'Running' | 'Stopped' = 'Stopped';
let keepAliveInterval: number | null = null;
let consecutiveFailures: number = 0;
let lastPingTime: string = '';
let currentPingFrequency: number = 4; // in minutes
let sessionActive: boolean = false;
const MAX_CONSECUTIVE_FAILURES = 3;

// Persistence manager to handle service worker restarts
class PersistenceManager {
    private static readonly STORAGE_KEYS = {
        KEEP_ALIVE_STATE: 'keepAliveState',
        URL: 'keepAliveUrl',
        FAILURES: 'consecutiveFailures',
        LAST_PING: 'lastPingTime',
        FREQUENCY: 'pingFrequency',
        SESSION_ACTIVE: 'sessionActive'
    };

    static async saveState(): Promise<void> {
        try {
            await chrome.storage.local.set({
                [this.STORAGE_KEYS.KEEP_ALIVE_STATE]: keepAlive,
                [this.STORAGE_KEYS.URL]: url,
                [this.STORAGE_KEYS.FAILURES]: consecutiveFailures,
                [this.STORAGE_KEYS.LAST_PING]: lastPingTime,
                [this.STORAGE_KEYS.FREQUENCY]: currentPingFrequency,
                [this.STORAGE_KEYS.SESSION_ACTIVE]: sessionActive
            });
            console.log('📄 State saved to storage');
        } catch (error) {
            console.error('❌ Failed to save state:', error);
        }
    }

    static async loadState(): Promise<void> {
        try {
            const result = await chrome.storage.local.get([
                this.STORAGE_KEYS.KEEP_ALIVE_STATE,
                this.STORAGE_KEYS.URL,
                this.STORAGE_KEYS.FAILURES,
                this.STORAGE_KEYS.LAST_PING,
                this.STORAGE_KEYS.FREQUENCY,
                this.STORAGE_KEYS.SESSION_ACTIVE
            ]);

            keepAlive = result[this.STORAGE_KEYS.KEEP_ALIVE_STATE] || 'Stopped';
            url = result[this.STORAGE_KEYS.URL] || defaultUrl;
            consecutiveFailures = result[this.STORAGE_KEYS.FAILURES] || 0;
            lastPingTime = result[this.STORAGE_KEYS.LAST_PING] || '';
            currentPingFrequency = result[this.STORAGE_KEYS.FREQUENCY] || 4;
            sessionActive = result[this.STORAGE_KEYS.SESSION_ACTIVE] || false;

            console.log('📄 State loaded from storage:', {
                keepAlive,
                url,
                consecutiveFailures,
                lastPingTime,
                currentPingFrequency,
                sessionActive
            });
        } catch (error) {
            console.error('❌ Failed to load state:', error);
        }
    }

    static async clearState(): Promise<void> {
        try {
            await chrome.storage.local.remove([
                this.STORAGE_KEYS.KEEP_ALIVE_STATE,
                this.STORAGE_KEYS.URL,
                this.STORAGE_KEYS.FAILURES,
                this.STORAGE_KEYS.LAST_PING,
                this.STORAGE_KEYS.FREQUENCY,
                this.STORAGE_KEYS.SESSION_ACTIVE
            ]);
            console.log('📄 State cleared from storage');
        } catch (error) {
            console.error('❌ Failed to clear state:', error);
        }
    }
}

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
    }    /**
     * Performs a smart ping with exponential backoff on failures
     */
    async smartPing(): Promise<boolean> {
        try {
            lastPingTime = new Date().toISOString();
            
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
            
            console.log(`🔄 Keep-alive ping: ${response.status} - ${lastPingTime}`);
            
            if (response.ok) {
                consecutiveFailures = 0;
                sessionActive = true;
                currentPingFrequency = 4; // Reset to normal frequency
                await PersistenceManager.saveState(); // Save successful state
                return true;
            }
            
            // Handle different error cases
            if (response.status === 401 || response.status === 403) {
                console.log('🔐 Session expired, attempting to refresh');
                sessionActive = false;
                await this.attemptSessionRefresh();
                await PersistenceManager.saveState();
                return false;
            }
            
            consecutiveFailures++;
            sessionActive = false;
            await PersistenceManager.saveState();
            return false;
            
        } catch (error) {
            consecutiveFailures++;
            sessionActive = false;
            console.error(`❌ Keep-alive ping failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`, error);
            
            // If we have too many failures, check if we should stop
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.warn('⚠️ Too many consecutive failures, session may be lost');
                currentPingFrequency = 8; // Increase frequency on persistent failures
            }
            
            await PersistenceManager.saveState();
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
 * Starts the keep-alive mechanism using Chrome alarms for reliability.
 * This approach survives service worker restarts better than setInterval.
 */
async function startKeepAlive(): Promise<void> {
    keepAlive = 'Running';
    consecutiveFailures = 0;
    
    // Clear any existing alarms and intervals
    await chrome.alarms.clear('keepAlive');
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }

    const sessionManager = SessionManager.getInstance();

    // Function to ping the server with smart retry logic
    const pingServer = async (): Promise<void> => {
        console.log('🔄 Executing scheduled ping...');
        await sessionManager.smartPing();
        
        // Adjust ping frequency based on failures
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.log('⚠️ Reducing ping frequency due to consecutive failures');
            currentPingFrequency = 8; // 8 minutes
            await setupNextAlarm();
        }
    };

    // Start with an immediate ping
    await pingServer();
    
    // Set up the next alarm
    await setupNextAlarm();
    
    // Save state to persist across service worker restarts
    await PersistenceManager.saveState();
    
    console.log('🚀 Keep-alive started with Chrome alarms and persistence');
}

/**
 * Sets up the next Chrome alarm for keep-alive pings
 */
async function setupNextAlarm(): Promise<void> {
    await chrome.alarms.clear('keepAlive');
    await chrome.alarms.create('keepAlive', {
        delayInMinutes: currentPingFrequency
    });
    console.log(`⏰ Next ping scheduled in ${currentPingFrequency} minutes`);
}

/**
 * Stops the keep-alive mechanism and cleans up resources.
 */
async function stopKeepAlive(): Promise<void> {
    keepAlive = 'Stopped';
    
    // Clear alarms and intervals
    await chrome.alarms.clear('keepAlive');
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }

    // Save stopped state
    await PersistenceManager.saveState();

    console.log('🛑 Keep-alive stopped and state saved');
}

// Chrome alarms listener for keep-alive pings
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('⏰ Alarm triggered: executing keep-alive ping');
        
        // Load current state in case service worker restarted
        await PersistenceManager.loadState();
        
        if (keepAlive === 'Running') {
            const sessionManager = SessionManager.getInstance();
            await sessionManager.smartPing();
            
            // Schedule next ping
            await setupNextAlarm();
        } else {
            console.log('⚠️ Keep-alive is stopped, not executing ping');
        }
    }
});

// Message listener for popup communication
chrome.runtime.onMessage.addListener((
    request: KeepAliveMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: KeepAliveResponse | DetailedStatusResponse) => void
): boolean => {
    console.log('📨 Background received message:', request);
    
    (async () => {
        // Load current state for all operations
        await PersistenceManager.loadState();
        
        if (request.action === 'start keepalive') {
            url = request.url?.match(/apps\.openu\.ac\.il/) ? request.url : defaultUrl;
            console.log('🚀 Starting keep-alive with URL:', url);
            
            // Stop any existing keep-alive first
            await stopKeepAlive();
            
            // Start the new keep-alive
            await startKeepAlive();
            
            const response = { 
                status: 'running' as const, 
                url: url,
                consecutiveFailures,
                sessionActive,
                lastPing: lastPingTime
            };
            console.log('📤 Sending start response:', response);
            sendResponse(response);
            
        } else if (request.action === 'stop keepalive') {
            console.log('🛑 Stopping keep-alive');
            await stopKeepAlive();
            const response = { 
                status: 'stopped' as const, 
                url: url,
                consecutiveFailures,
                sessionActive: false,
                lastPing: lastPingTime
            };
            console.log('📤 Sending stop response:', response);
            sendResponse(response);
            
        } else if (request.action === 'getStatus') {
            const response = { 
                status: keepAlive.toLowerCase() as 'running' | 'stopped', 
                url: url,
                consecutiveFailures,
                sessionActive,
                lastPing: lastPingTime
            };
            console.log('📤 Sending status response:', response);
            sendResponse(response);
            
        } else if (request.action === 'getDetailedStatus') {
            const detailedResponse: DetailedStatusResponse = {
                status: keepAlive.toLowerCase() as 'running' | 'stopped',
                url: url,
                consecutiveFailures,
                sessionActive,
                lastPing: lastPingTime,
                pingFrequency: currentPingFrequency
            };
            sendResponse(detailedResponse);
        }
    })().catch(error => {
        console.error('❌ Error handling message:', error);
        sendResponse({ 
            status: 'stopped' as const, 
            url: url || defaultUrl,
            consecutiveFailures: 999,
            sessionActive: false,
            lastPing: ''
        });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
});

// Service worker lifecycle management
chrome.runtime.onStartup.addListener(async () => {
    console.log('🚀 Extension started (browser startup)');
    await restoreStateAndResume();
});

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🚀 Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🆕 First time installation');
        await PersistenceManager.clearState();
    } else if (details.reason === 'update') {
        console.log('🔄 Extension updated, restoring state');
        await restoreStateAndResume();
    }
    
    console.log('📊 Initial state:', { keepAlive, url, consecutiveFailures });
});

// Restore state when service worker restarts
async function restoreStateAndResume(): Promise<void> {
    try {
        await PersistenceManager.loadState();
        
        console.log('🔄 Service worker restarted, restored state:', {
            keepAlive,
            url,
            consecutiveFailures,
            sessionActive,
            lastPingTime,
            currentPingFrequency
        });
        
        // If keep-alive was running, resume it
        if (keepAlive === 'Running') {
            console.log('▶️ Resuming keep-alive after service worker restart');
            
            // Check if there's already an active alarm
            const existingAlarm = await chrome.alarms.get('keepAlive');
            if (!existingAlarm) {
                console.log('⏰ No existing alarm found, setting up new one');
                await setupNextAlarm();
            } else {
                console.log('⏰ Existing alarm found, will continue when it fires');
            }
        }
    } catch (error) {
        console.error('❌ Failed to restore state:', error);
    }
}

// Initialize on script load (for service worker restart)
(async () => {
    await restoreStateAndResume();
})();
