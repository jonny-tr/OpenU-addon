(function() {
    const url = 'https://sheilta.apps.openu.ac.il/';
    chrome.runtime.sendMessage({ action: 'start longpoll', url: url }, (response) => {
        if (response) {
            console.log(`Keep alive started for URL: ${response.url}`);
        } else {
            console.error('Failed to start keep alive');
        }
    });
})();
