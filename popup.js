document.addEventListener('DOMContentLoaded', function() {
  const urlList = document.getElementById('url-list');
  const selectAllCheckbox = document.getElementById('select-all');
  const copyButton = document.getElementById('copy-button');
  const pasteDetectButton = document.getElementById('paste-detect-button');
  const message = document.getElementById('message');
  const newTabUrls = [
    'chrome://newtab/',
    'about:newtab',
    'edge://newtab/',
    'brave://newtab/',
    'chrome://startpageshared/',
    'about:home',
    'about:blank'
  ];
  // Get all tabs and display their URLs
  chrome.tabs.query({}, function(tabs) {
    
    tabs.forEach(function(tab, index) {
      if (tab.url && !newTabUrls.includes(tab.url) && tab.url !== '' && tab.url.startsWith('http')){
      const urlItem = document.createElement('div');
      urlItem.className = 'url-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'url-checkbox';
      checkbox.dataset.url = tab.url;
      
      const urlText = document.createElement('span');
      urlText.className = 'url-text';
      urlText.textContent = tab.title;
      urlText.title = tab.url;
      
      urlItem.appendChild(checkbox);
      urlItem.appendChild(urlText);
      urlList.appendChild(urlItem);
      }
    });
  });
  
  // Select/deselect all URLs
  selectAllCheckbox.addEventListener('change', function() {
    const checkboxes = document.getElementsByClassName('url-checkbox');
    for (let checkbox of checkboxes) {
      checkbox.checked = selectAllCheckbox.checked;
    }
  });

  copyButton.addEventListener('click', function() {
      const checkboxes = document.getElementsByClassName('url-checkbox');
      const selectedUrls = [];
      
      for (let checkbox of checkboxes) {
        if (checkbox.checked) {
          selectedUrls.push(checkbox.dataset.url);
        }
      }
      
      if (selectedUrls.length > 0) {
        let urlString = '';
        for (let i = 0; i < selectedUrls.length; i++) {
          urlString += selectedUrls[i];
          urlString += ';';
          
        }

        navigator.clipboard.writeText(urlString).then(function() {
          message.style.display = 'block';
          message.textContent = 'URLs copied to clipboard!';
          setTimeout(function() {
            message.style.display = 'none';
          }, 2000);
        });
      } else {
        message.style.display = 'block';
        message.textContent = 'No URLs selected!';
        message.style.color = 'red';
        setTimeout(function() {
          message.style.display = 'none';
          message.style.color = 'green';
        }, 2000);
      }
    });
    
    // Detect and open pasted URLs
    pasteDetectButton.addEventListener('click', function() {
      navigator.clipboard.readText().then(function(text) {
        if (text && text.includes(';')) {
          const urls = text.split(';');
          message.style.display = 'block';
          message.textContent = `Opening ${urls.length-1} URLs...`;
          
          urls.forEach(function(url) {
            if (url.trim().startsWith('http')) {
              chrome.tabs.create({ url: url.trim() });
            }
          });
          
          setTimeout(function() {
            message.style.display = 'none';
          }, 2000);
        } else {
          message.style.display = 'block';
          message.textContent = 'No valid URL string found in clipboard!';
          message.style.color = 'red';
          setTimeout(function() {
            message.style.display = 'none';
          }, 2000);
        }
      });
    });
  });