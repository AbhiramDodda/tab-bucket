// popup.js - Updated to filter empty and new tabs
document.addEventListener('DOMContentLoaded', function() {
  const urlList = document.getElementById('url-list');
  const selectAllCheckbox = document.getElementById('select-all');
  const copyButton = document.getElementById('copy-button');
  const pasteOpenButton = document.getElementById('paste-open-button');
  const message = document.getElementById('message');
  
  // Use browser-polyfill for cross-browser compatibility
  const browserAPI = window.browser || chrome;
  
  // Get all tabs and display their URLs, filtering out empty and new tabs
  browserAPI.tabs.query({}, function(tabs) {
    // Filter out empty tabs and new tab pages
    const validTabs = tabs.filter(tab => {
      // Check for new tab URLs across different browsers
      const newTabUrls = [
        'chrome://newtab/',
        'about:newtab',
        'edge://newtab/',
        'brave://newtab/',
        'chrome://startpageshared/',
        'about:home',
        'about:blank'
      ];
      
      // Return false (filter out) if this is a new tab or empty page
      return tab.url && 
             !newTabUrls.includes(tab.url) && 
             tab.url !== '' &&
             tab.url.startsWith('http'); // Only include web URLs
    });
    
    if (validTabs.length === 0) {
      urlList.innerHTML = '<div class="no-tabs">No valid tabs found</div>';
      return;
    }
    
    // Display the filtered tabs
    validTabs.forEach(function(tab) {
      const urlItem = document.createElement('div');
      urlItem.className = 'url-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'url-checkbox';
      checkbox.dataset.url = tab.url;
      
      const urlText = document.createElement('span');
      urlText.className = 'url-text';
      urlText.textContent = tab.title || 'Untitled Tab';
      urlText.title = tab.url;
      
      urlItem.appendChild(checkbox);
      urlItem.appendChild(urlText);
      urlList.appendChild(urlItem);
    });
  });
  
  // Select/deselect all URLs
  selectAllCheckbox.addEventListener('change', function() {
    const checkboxes = document.getElementsByClassName('url-checkbox');
    for (let checkbox of checkboxes) {
      checkbox.checked = selectAllCheckbox.checked;
    }
  });
  
  // Copy selected URLs as a semicolon-separated string
  copyButton.addEventListener('click', function() {
    const checkboxes = document.getElementsByClassName('url-checkbox');
    const selectedUrls = [];
    
    for (let checkbox of checkboxes) {
      if (checkbox.checked) {
        selectedUrls.push(checkbox.dataset.url);
      }
    }
    
    if (selectedUrls.length > 0) {
      const urlString = selectedUrls.join(';');
      
      // Cross-browser clipboard approach
      const textArea = document.createElement('textarea');
      textArea.value = urlString;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        
        if (successful) {
          message.style.display = 'block';
          message.textContent = `URLs copied! Share this string with others.`;
          setTimeout(function() {
            message.style.display = 'none';
          }, 3000);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        // Fallback to clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlString).then(function() {
            message.style.display = 'block';
            message.textContent = `URLs copied! Share this string with others.`;
            setTimeout(function() {
              message.style.display = 'none';
            }, 3000);
          });
        } else {
          message.style.display = 'block';
          message.textContent = 'Failed to copy. Please try again.';
          message.style.color = 'red';
          setTimeout(function() {
            message.style.display = 'none';
          }, 2000);
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } else {
      message.style.display = 'block';
      message.textContent = 'No URLs selected!';
      message.style.color = 'red';
      setTimeout(function() {
        message.style.display = 'none';
      }, 2000);
    }
  });
  
  // Read from clipboard and open URLs
  pasteOpenButton.addEventListener('click', function() {
    // Try to use Clipboard API first (modern browsers)
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(processUrlString).catch(function(err) {
        // Fallback for clipboard permission issues
        promptForPaste();
      });
    } else {
      // Fallback for older browsers
      promptForPaste();
    }
  });
  
  function processUrlString(text) {
    if (text && text.includes(';')) {
      const urls = text.split(';');
      const validUrls = urls.filter(url => url.trim().startsWith('http'));
      
      if (validUrls.length > 0) {
        message.style.display = 'block';
        message.textContent = `Opening ${validUrls.length} URLs...`;
        
        validUrls.forEach(function(url) {
          browserAPI.tabs.create({ url: url.trim() });
        });
        
        setTimeout(function() {
          message.style.display = 'none';
        }, 2000);
      } else {
        message.style.display = 'block';
        message.textContent = 'No valid URLs found in the string!';
        message.style.color = 'red';
        setTimeout(function() {
          message.style.display = 'none';
        }, 2000);
      }
    } else {
      message.style.display = 'block';
      message.textContent = 'No valid URL string found in clipboard!';
      message.style.color = 'red';
      setTimeout(function() {
        message.style.display = 'none';
      }, 2000);
    }
  }
  
  function promptForPaste() {
    message.style.display = 'block';
    message.textContent = 'Please paste the URL string manually:';
    message.style.color = 'black';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.style.width = '100%';
    input.style.marginTop = '10px';
    message.appendChild(input);
    
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Process URLs';
    submitBtn.style.marginTop = '10px';
    message.appendChild(submitBtn);
    
    submitBtn.addEventListener('click', function() {
      processUrlString(input.value);
      message.style.display = 'none';
      message.innerHTML = 'URLs copied to clipboard!';
    });
  }
});