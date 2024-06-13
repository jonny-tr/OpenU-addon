let intervalId = null;
const defaultUrl = 'https://sheilta.apps.openu.ac.il/pls/dmyopt2/myop.myop_screen';
const defaultDomain = new URL(defaultUrl).hostname;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    const url = request.url || defaultUrl;
    const interval = request.interval || 1500000; // Default to 25 minutes

       if (intervalId !== null) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const tab = tabs.find(tab => {
          const tabUrl = new URL(tab.url);
          return tabUrl.hostname === defaultDomain;
        });
      
        if (tab) {
          const tabId = tab.id;
          chrome.tabs.update(tabId, { active: true }, () => {
            // Perform additional interaction to keep the session alive
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              function: simulateInteraction,
            });
          });
        }
      });
    }, interval);

    chrome.storage.local.set({ status: 'running', url: url }, () => {
      sendResponse({ status: 'started', url: url });
    });

    return true; // Indicates that the response will be sent asynchronously
  } else if (request.action === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    chrome.storage.local.set({ status: 'stopped' }, () => {
      sendResponse({ status: 'stopped' });
    });

    return true; // Indicates that the response will be sent asynchronously
  } else if (request.action === 'getStatus') {
    chrome.storage.local.get(['status', 'url'], (result) => {
      sendResponse({ status: result.status || 'stopped', url: result.url || defaultUrl });
    });

    return true; // Indicates that the response will be sent asynchronously
  }
});

function simulateInteraction() {
  // Click on a specific element on the page to keep the session active
  document.querySelector('button.keep-alive-button').click();
}