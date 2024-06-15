(function start() {
    let url = 'https://sheilta.apps.openu.ac.il/';
    chrome.runtime.sendMessage({ action: 'start', url: url }, (response))
})();