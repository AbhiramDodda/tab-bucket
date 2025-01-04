 chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CREATE_SHARE_LINK') {
      createShareLink(request.tabs)
        .then(shortUrl => sendResponse({ shortUrl }))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Required for async response
    } else if (request.type === 'OPEN_TABS') {
      openSharedTabs(request.urls);
      sendResponse({ success: true });
    }
  });
  
  async function createShareLink(tabs) {
    // Replace YOUR_BITLY_TOKEN with your actual Bitly API token
    const BITLY_TOKEN = 'YOUR_BITLY_TOKEN';
    
    // Create a JSON object with the tab URLs
    const data = { urls: tabs.map(tab => tab.url) };
    
    // Store data in a temporary hosting service (e.g., JSONBin.io)
    const binResponse = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': 'YOUR_JSONBIN_KEY'
      },
      body: JSON.stringify(data)
    });
    const binData = await binResponse.json();
    const longUrl = `https://api.jsonbin.io/v3/b/${binData.metadata.id}`;
  
    // Create short URL using Bitly
    const bitlyResponse = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BITLY_TOKEN}`
      },
      body: JSON.stringify({
        long_url: longUrl
      })
    });
    
    const bitlyData = await bitlyResponse.json();
    return bitlyData.link;
  }
  
  async function openSharedTabs(urls) {
    for (const url of urls) {
      chrome.tabs.create({ url });
    }
  }