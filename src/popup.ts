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

document.addEventListener('DOMContentLoaded', (): void => {
    console.log('Popup script loaded and DOM ready');
    
    const toggleButton = document.getElementById('toggle') as HTMLButtonElement;
    const statusElement = document.getElementById('status') as HTMLSpanElement;
    const urlElement = document.getElementById('url') as HTMLInputElement;
    const healthIndicator = document.getElementById('health-indicator') as HTMLDivElement;
    const detailedStatus = document.getElementById('detailed-status') as HTMLDivElement;
    const defaultUrl: string = 'https://sheilta.apps.openu.ac.il/pls/dmyopt2/myop.myop_screen';

    console.log('🔧 All DOM elements found:', {
        toggleButton: !!toggleButton,
        statusElement: !!statusElement,
        urlElement: !!urlElement,
        healthIndicator: !!healthIndicator,
        detailedStatus: !!detailedStatus
    });

    function updateButton(status: string): void {
        if (status === 'Running') {
            toggleButton.classList.remove('run');
            toggleButton.classList.add('stop');
            toggleButton.textContent = 'Stop';
            statusElement.innerText = 'Running';
        } else {
            toggleButton.classList.remove('stop');
            toggleButton.classList.add('run');
            toggleButton.textContent = 'Start';
            statusElement.innerText = 'Stopped';
        }
    }

    function updateHealthIndicator(response: KeepAliveResponse): void {
        const { consecutiveFailures = 0, sessionActive = false, lastPing } = response;
        
        // Update health indicator
        healthIndicator.className = 'health-indicator';
        let healthStatus = '';
        let healthClass = '';
        
        if (response.status === 'stopped') {
            healthStatus = '⚫';
            healthClass = 'stopped';
        } else if (consecutiveFailures === 0 && sessionActive) {
            healthStatus = '🟢';
            healthClass = 'healthy';
        } else if (consecutiveFailures > 0 && consecutiveFailures < 3) {
            healthStatus = '🟡';
            healthClass = 'warning';
        } else {
            healthStatus = '🔴';
            healthClass = 'error';
        }
        
        healthIndicator.textContent = healthStatus;
        healthIndicator.classList.add(healthClass);
        
        // Update detailed status
        if (response.status === 'running') {
            const failureText = consecutiveFailures > 0 ? ` (${consecutiveFailures} failures)` : '';
            const sessionText = sessionActive ? 'Active' : 'Inactive';
            const timeText = lastPing ? new Date(lastPing).toLocaleTimeString() : 'Never';
            
            detailedStatus.innerHTML = `
                <small>
                    Session: ${sessionText}${failureText}<br>
                    Last ping: ${timeText}
                </small>
            `;
        } else {
            detailedStatus.innerHTML = '<small>Click Start to begin monitoring</small>';
        }
    }
    
    function getStatus(): void {
        console.log('Getting status from background script...');
        chrome.runtime.sendMessage(
            { action: 'getStatus' } as KeepAliveMessage,
            (response: KeepAliveResponse) => {
                if (chrome.runtime.lastError) {
                    console.error('Error getting status:', chrome.runtime.lastError);
                    statusElement.innerText = 'Error';
                    detailedStatus.innerHTML = '<small style="color: red;">Extension error</small>';
                    return;
                }
                
                console.log('Status response received:', response);
                urlElement.value = response.url || defaultUrl;
                // Convert backend status to UI status
                const uiStatus = response.status === 'running' ? 'Running' : 'Stopped';
                updateButton(uiStatus);
                updateHealthIndicator(response);
            }
        );
    }

    getStatus();    toggleButton.addEventListener('click', (): void => {
        const currentStatus: string = statusElement.innerText.includes('Running') ? 'Running' : 'Stopped';
        const url: string = urlElement.value || defaultUrl;
        
        console.log('Button clicked! Current status:', currentStatus, 'URL:', url);
        
        // Disable button during operation
        toggleButton.disabled = true;
        
        if (currentStatus === 'Stopped') {
            console.log('Sending start keepalive message...');
            chrome.runtime.sendMessage(
                { action: 'start keepalive', url: url } as KeepAliveMessage,
                (response: KeepAliveResponse) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error starting keep-alive:', chrome.runtime.lastError);
                        detailedStatus.innerHTML = '<small style="color: red;">Failed to start</small>';
                    } else {
                        console.log('Start response received:', response);
                        updateHealthIndicator(response);
                    }
                    getStatus();
                    toggleButton.disabled = false;
                }
            );
        } else if (currentStatus === 'Running') {
            console.log('Sending stop keepalive message...');
            chrome.runtime.sendMessage(
                { action: 'stop keepalive' } as KeepAliveMessage,
                (response: KeepAliveResponse) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error stopping keep-alive:', chrome.runtime.lastError);
                        detailedStatus.innerHTML = '<small style="color: red;">Failed to stop</small>';
                    } else {
                        console.log('Stop response received:', response);
                        updateHealthIndicator(response);
                    }
                    getStatus();
                    toggleButton.disabled = false;
                }
            );
        }
    });

    // Auto-refresh status every 30 seconds when running
    setInterval(() => {
        if (statusElement.innerText.includes('Running')) {
            getStatus();
        }
    }, 30000);
});
