/**
 * Event listener that triggers when the DOM content is loaded.
 * Initializes the popup and sets up event handlers.
 *
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle');
    let url = document.getElementById('url').value
                || 'https://sheilta.apps.openu.ac.il/';

    /**
     * Updates the toggle button text and click event handler based on the action.
     *
     * @function updateButton
     * @param {string} action - The action to perform ('Start' or 'Stop').
     */
    function updateButton(action) {
        if (action === 'stop') {
            toggleButton.classList.remove('run');
            toggleButton.classList.add('stop');
            toggleButton.textContent = 'Stop';
            document.getElementById('status').innerText = ': stopped';
        } else {
            toggleButton.classList.remove('stop');
            toggleButton.classList.add('run');
            toggleButton.textContent = 'Start';
            document.getElementById('status').innerText = ': running';

        }
    }

    // Get the current status from the background script
    (function getStatus() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            document.getElementById('url').value = response.url;
            if (response.status === 'Running') {
                updateButton('stop');
                return 'Running';
            }
            else {
                updateButton('start');
                return 'Stopped';
            }
        });
    })();

    toggleButton.addEventListener('click', () => {
        console.log('Button clicked');
        let state = getStatus();
        if (state === 'Stopped') {
            chrome.runtime.sendMessage({ action: 'start longpoll', url: url }, (response) => {
                updateButton('stop');
            });
        }
        else if (state === 'Running') {
            chrome.runtime.sendMessage({ action: 'stop longpoll' }, (response) => {
                updateButton('start');
            });
        }
    });
});
