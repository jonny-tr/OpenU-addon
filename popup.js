/**
 * Event listener that triggers when the DOM content is loaded.
 * Initializes the popup and sets up event handlers.
 *
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle');
    const urlInput = document.getElementById('url');

    /**
     * Updates the toggle button text and click event handler based on the action.
     *
     * @function updateButton
     * @param {string} action - The action to perform ('start' or 'stop').
     */
    function updateButton(action) {
        if (action === 'stop') {
            toggleButton.classList.remove('run');
            toggleButton.classList.add('stop');
            toggleButton.textContent = 'Stop';
            document.getElementById('status').innerText = 'Running';
        } else {
            toggleButton.classList.remove('stop');
            toggleButton.classList.add('run');
            toggleButton.textContent = 'Start';
            document.getElementById('status').innerText = 'Stopped';
        }
    }

    // Get the current status from the background script
    function getStatus() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            urlInput.value = response.url;
            if (response.status === 'running') {
                updateButton('stop');
            } else {
                updateButton('start');
            }
        });
    }

    // Initialize the popup with the current status
    getStatus();

    toggleButton.addEventListener('click', () => {
        const url = urlInput.value || 'https://sheilta.apps.openu.ac.il/';
        if (toggleButton.textContent === 'Start') {
            chrome.runtime.sendMessage({ action: 'start longpoll', url: url }, (response) => {
                updateButton('stop');
            });
        } else if (toggleButton.textContent === 'Stop') {
            chrome.runtime.sendMessage({ action: 'stop longpoll' }, (response) => {
                updateButton('start');
            });
        }
    });
});
