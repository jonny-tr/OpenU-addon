const defaultUrl = 'https://sheilta.apps.openu.ac.il/';
let url = defaultUrl;
let keepAlive = 'Stopped';

/**
 * Performs a long polling request to the specified default URL.
 *
 * @param {string} url - The URL to poll.
 * @return {void} This function does not return anything.
 */
function longPoll() {
    keepAlive = 'Running';
    fetch(url, {
        method: 'GET',
        mode: 'no-cors'
    })
        .then(() => {
            console.log("Request sent successfully");
            setTimeout(longPoll, 15 * 60 * 1000); // Poll every 15 minutes
        })
        .catch(error => {
            console.error("Error: " + error);
            setTimeout(longPoll, 5 * 1000); // If there's an error, try again 
        });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!userUrl.match(/apps\.openu\.ac\.il/)) {
        url = request.url;
    }
    if (request.action === 'start') {
        longPoll();
    }
    else if (request.action === 'stop') {
        keepAlive = 'Stopped';
    }
    else if (request.action === 'getStatus') {
        sendResponse({ status: keepAlive });
    }
});