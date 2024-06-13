document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    document.getElementById('status').innerText = response.status === 'running' ? `Running` : 'Stopped';
    document.getElementById('url').value = response.url;
  });

  document.getElementById('start').addEventListener('click', () => {
    const url = document.getElementById('url').value;
    chrome.runtime.sendMessage({ action: 'start', url: url }, (response) => {
      document.getElementById('status').innerText = `Running for URL: ${response.url}`;
    });
  });

  document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
      document.getElementById('status').innerText = 'Stopped';
    });
  });
});
