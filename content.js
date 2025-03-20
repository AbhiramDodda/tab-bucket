console.log('URL Manager content script loaded');

// Listen for paste events
document.addEventListener('paste', function(event) {
  const pastedText = event.clipboardData.getData('text');
  
  // Check if the pasted text looks like our URL format
  if (pastedText && pastedText.includes(';') && pastedText.includes('http')) {
    // Send to background script to handle
    chrome.runtime.sendMessage({
      action: 'checkPastedUrls',
      text: pastedText
    });
  }
});