const defaultUrl = 'https://sheilta.apps.openu.ac.il/';
let url = defaultUrl;
let keepAlive = 'Stopped';
let iframeElement = null;

/**
 * Creates an invisible iframe and loads the specified URL.
 *
 * @return {void} This function does not return anything.
 */
function createIframe() {
    keepAlive = 'Running';
    iframeElement = document.createElement('iframe');
    iframeElement.src = url;
    iframeElement.style.display = 'none';
    document.body.appendChild(iframeElement);

    // Periodically reload the iframe to keep the connection alive
    setInterval(() => {
        try {
            const iframeDoc = iframeElement.contentWindow.document;
            iframeDoc.open();
            iframeDoc.close();
        } catch (error) {
            console.error("Error reloading iframe: " + error);
        }
    }, 5 * 60 * 1000); // Reload every 15 minutes
}

/**
 * Removes the invisible iframe from the document.
 *
 * @return {void} This function does not return anything.
 */
function removeIframe() {
    keepAlive = 'Stopped';
    if (iframeElement) {
        document.body.removeChild(iframeElement);
        iframeElement = null;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start keepalive') {
        url = request.url.match(/apps\.openu\.ac\.il/) ? request.url : defaultUrl;
        removeIframe();
        sendResponse({ status: 'running', url: url });
        createIframe();
    } else if (request.action === 'stop keepalive') {
        removeIframe();
        sendResponse({ status: 'stopped', url: url });
    } else if (request.action === 'getStatus') {
        sendResponse({ status: keepAlive, url: url });
    }
});