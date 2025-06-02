import { StartKeepAliveMessage, KeepAliveResponse } from './types.js';

(function(): void {
    const url: string = 'https://sheilta.apps.openu.ac.il/';    chrome.runtime.sendMessage(
        { action: 'start keepalive', url: url } as StartKeepAliveMessage,
        (response: KeepAliveResponse | undefined) => {
            if (response) {
                console.log(`Keep alive started for URL: ${response.url}`);
            } else {
                console.error('Failed to start keep alive');
            }
        }
    );
})();
