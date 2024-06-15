const toggleButton = document.getElementById('toggle');

/**
 * Starts the extension by sending a message to the background script.
 * Updates the status and button text accordingly.
 *
 * @function start
 */
function start() {
    let url = document.getElementById('url').value
        || 'https://sheilta.apps.openu.ac.il/';

    chrome.runtime.sendMessage({ action: 'start', url: url }, (response) => {
        document.getElementById('status').innerText =
            `Running on: ${response.url}`;
        updateButton('stop');
    });
}

/**
 * Stops the extension by sending a message to the background script.
 * Updates the status and button text accordingly.
 *
 * @function stop
 */
function stop() {
    chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
        document.getElementById('status').innerText = 'Stopped';
        updateButton('start');
    });
}

/**
 * Updates the toggle button text and click event handler based on the action.
 *
 * @function updateButton
 * @param {string} action - The action to perform ('start' or 'stop').
 */
function updateButton(action) {
    toggleButton.innerText = action.charAt(0).toUpperCase() + action.slice(1);
    if (action === 'start') {
        toggleButton.onclick = start;
        toggleButton.classList.remove('stopped');
        toggleButton.classList.add('running');
        toggleButton.textContent = 'Running';
    } else {
        toggleButton.onclick = stop;
        toggleButton.classList.remove('running');
        toggleButton.classList.add('stopped');
        toggleButton.textContent = 'Stopped';
    }
}

/**
 * Event listener that triggers when the DOM content is loaded.
 * Initializes the popup and sets up event handlers.
 *
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get the current status from the background script
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        if (response.status === 'Running') {
            document.getElementById('status').innerText = `Running on: ${response.url}`;
            updateButton('Stop');
        } else {
            document.getElementById('status').innerText = 'Stopped';
            updateButton('Start');
        }
        document.getElementById('url').innerText = response.url;
    });
});
