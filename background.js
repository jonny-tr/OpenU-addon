const defaultUrl = 'https://sheilta.apps.openu.ac.il/pls/dmyopt2/myop.myop_screen';
const defaultDomain = new URL(defaultUrl).hostname;
let intervalId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    const url = request.url || defaultUrl;
    const interval = request.interval || 1200000; // Default to 20 minutes

    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // Set initial expiration for session cookies to 24 hours from now
    setInitialCookieExpiration(defaultDomain);

    intervalId = setInterval(() => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const tab = tabs.find(tab => {
          const tabUrl = new URL(tab.url);
          return tabUrl.hostname === defaultDomain;
        });

        if (tab) {
          const tabId = tab.id;
          chrome.tabs.update(tabId, { active: true }, () => {
            // Check and extend session cookies that expire within the next hour
            extendExpiringCookies(defaultDomain);
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

function setInitialCookieExpiration(domain) {
  chrome.cookies.getAll({ domain: domain }, (cookies) => {
    cookies.forEach(cookie => {
      if (cookie.session && !cookie.expirationDate) {
        // Set initial expiration for session cookies to 24 hours from now
        const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        chrome.cookies.set({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          expirationDate: expirationTime / 1000, // Convert milliseconds to seconds
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
        });
        console.log(`Initial expiration set for session cookie ${cookie.name}.`);
      }
    });
  });
}

function extendExpiringCookies(domain) {
  chrome.cookies.getAll({ domain: domain }, (cookies) => {
    cookies.forEach(cookie => {
      if (cookie.session && cookie.expirationDate) {
        const expirationTime = cookie.expirationDate * 1000; // Convert seconds to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expirationTime - now;

        // Extend expiration for cookies expiring within the next hour by additional two hours
        const extendThreshold = 60 * 60 * 1000; // 1 hour in milliseconds
        const extendDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

        if (timeUntilExpiry < extendThreshold) {
          const newExpirationTime = now + extendDuration;
          chrome.cookies.set({
            url: `https://${cookie.domain}${cookie.path}`,
            name: cookie.name,
            value: cookie.value,
            expirationDate: newExpirationTime / 1000,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
          });
          console.log(`Session cookie ${cookie.name} extended.`);
        }
      }
    });
  });
}
