(function start() {
const url = 'https://sheilta.apps.openu.ac.il/';
chrome.runtime.sendMessage({ action: 'start longpoll', url: url }, (response))
})();