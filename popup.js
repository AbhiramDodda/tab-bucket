document.addEventListener('DOMContentLoaded', () => {
    const tabsList = document.getElementById('tabs-list');
    const shareButton = document.getElementById('share-button');
    let tabs = [];
  
    // Fetch all open tabs
    chrome.tabs.query({}, (allTabs) => {
      allTabs.forEach((tab) => {
        if (tab.url) {
          tabs.push(tab.url);  // Save all open tab URLs
          const listItem = document.createElement('li');
          listItem.textContent = tab.title;  // Display the title of the tab
          tabsList.appendChild(listItem);
        }
      });
    });
  
    // Generate a sharable link when the button is clicked
    shareButton.addEventListener('click', () => {
      if (tabs.length > 0) {
        const shareableLink = 'https://my-share-service.com/?urls=' + encodeURIComponent(tabs.join(','));
        navigator.clipboard.writeText(shareableLink).then(() => {
          alert('Shareable link copied to clipboard!');
        });
      }
    });
  });
  