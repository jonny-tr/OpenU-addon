const defaultUrl = 'https://sheilta.apps.openu.ac.il/';
let url = defaultUrl;
let keepAlive = 'Stopped';
let timeoutId = null;

/**
 * Performs a long polling request to the specified URL.
 *
 * @return {void} This function does not return anything.
 */
function longPoll() {
    keepAlive = 'Running';
    fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include', // To include cookies in the request
    })
        .then(() => {
            console.log("Request sent successfully");
            timeoutId = setTimeout(longPoll, 15 * 60 * 1000); // Poll every 15 minutes
        })
        .catch(error => {
            console.error("Error: " + error);
            timeoutId = setTimeout(longPoll, 5 * 1000); // If there's an error, try again after 5 seconds
        });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start longpoll') {
        url = request.url.match(/apps\.openu\.ac\.il/) ? request.url : defaultUrl;
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        sendResponse({ status: 'running', url: url });
        longPoll();
    } else if (request.action === 'stop longpoll') {
        keepAlive = 'Stopped';
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        sendResponse({ status: 'stopped', url: url });
    } else if (request.action === 'getStatus') {
        sendResponse({ status: keepAlive, url: url });
    }
});
