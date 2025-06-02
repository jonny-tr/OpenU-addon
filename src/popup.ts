import { KeepAliveMessage, KeepAliveResponse } from './types.js';

document.addEventListener('DOMContentLoaded', (): void => {
    const toggleButton = document.getElementById('toggle') as HTMLButtonElement;
    const statusElement = document.getElementById('status') as HTMLSpanElement;
    const urlElement = document.getElementById('url') as HTMLInputElement;
    const defaultUrl: string = 'https://sheilta.apps.openu.ac.il/pls/dmyopt2/myop.myop_screen';

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
    }    function getStatus(): void {
        chrome.runtime.sendMessage(
            { action: 'getStatus' } as KeepAliveMessage,
            (response: KeepAliveResponse) => {
                urlElement.value = response.url || defaultUrl;
                // Convert backend status to UI status
                const uiStatus = response.status === 'running' ? 'Running' : 'Stopped';
                updateButton(uiStatus);
            }
        );
    }

    getStatus();

    toggleButton.addEventListener('click', (): void => {
        const currentStatus: string = statusElement.innerText.includes('Running') ? 'Running' : 'Stopped';
        const url: string = urlElement.value || defaultUrl;        if (currentStatus === 'Stopped') {
            chrome.runtime.sendMessage(
                { action: 'start keepalive', url: url } as KeepAliveMessage,
                (response: KeepAliveResponse) => {
                    getStatus();
                }
            );
        } else if (currentStatus === 'Running') {
            chrome.runtime.sendMessage(
                { action: 'stop keepalive' } as KeepAliveMessage,
                (response: KeepAliveResponse) => {
                    getStatus();
                }
            );
        }
    });
});
