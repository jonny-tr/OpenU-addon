interface StartKeepAliveMessage {
    action: 'start keepalive';
    url: string;
}

interface KeepAliveResponse {
    url: string;
    status: 'running' | 'stopped';
    sessionActive?: boolean;
}

(function(): void {
    // Only auto-start on internal user OpenU domains
    const currentUrl = window.location.href;
    const isOpenUDomain = currentUrl.includes('apps.openu.ac.il');
    
    if (!isOpenUDomain) {
        console.log('Not on OpenU domain, skipping auto keep-alive start');
        return;
    }

    // Use the current page URL for more accurate session tracking
    const url: string = window.location.origin + '/';
    
    console.log('OpenU page detected, starting keep-alive for: ', url);

    chrome.runtime.sendMessage(
        { action: 'start keepalive', url: url } as StartKeepAliveMessage,
        (response: KeepAliveResponse | undefined) => {
            if (chrome.runtime.lastError) {
                console.error('Keep-alive start failed:', chrome.runtime.lastError.message);
                return;
            }
            
            if (response) {
                console.log(`Keep alive started for URL: ${response.url}`);
                console.log(`Status: ${response.status}`);
                
                // Show a subtle notification if session is already active
                if (response.sessionActive) {
                    console.log('Session appears to be active');
                }
            } else {
                console.error('Failed to start keep alive - no response received');
            }
        }
    );

    // Listen for page visibility changes to re-activate keep-alive
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isOpenUDomain) {
            console.log('Page became visible, ensuring keep-alive is active');
            
            // Check status and restart if needed
            chrome.runtime.sendMessage(
                { action: 'getStatus' },
                (response: KeepAliveResponse | undefined) => {
                    if (response && response.status === 'stopped') {
                        console.log('Keep-alive was stopped, restarting');
                        chrome.runtime.sendMessage(
                            { action: 'start keepalive', url: url } as StartKeepAliveMessage
                        );
                    }
                }
            );
        }
    });
})();
