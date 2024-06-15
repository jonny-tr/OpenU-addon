document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle');
    const statusElement = document.getElementById('status');
    const urlElement = document.getElementById('url');
    const defaultUrl = 'https://sheilta.apps.openu.ac.il/pls/dmyopt2/myop.myop_screen';

    function updateButton(status) {
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

    function getStatus() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            urlElement.value = response.url || defaultUrl;
            updateButton(response.status);
        });
    }

    getStatus();

    toggleButton.addEventListener('click', () => {
        const currentStatus = statusElement.innerText.includes('Running') ? 'Running' : 'Stopped';
        const url = urlElement.value || defaultUrl;

        if (currentStatus === 'Stopped') {
            chrome.runtime.sendMessage({ action: 'start keepalive', url: url }, (response) => {
                getStatus();
            });
        } else if (currentStatus === 'Running') {
            chrome.runtime.sendMessage({ action: 'stop keepalive' }, (response) => {
                getStatus();
            });
        }
    });
});