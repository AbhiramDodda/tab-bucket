const JSONBIN_CONFIG = {
    baseUrl: 'https://api.jsonbin.io/v3/b',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': '$YOUR_JSONBIN_KEY' 
    }
  };
  
  const BITLY_CONFIG = {
    baseUrl: 'https://api-ssl.bitly.com/v4/shorten',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $YOUR_BITLY_TOKEN' 
    }
  };
  
  export async function createShareLink(tabs) {
    try {
      // Store tabs data in JSONBin
      const binResponse = await fetch(JSONBIN_CONFIG.baseUrl, {
        method: 'POST',
        headers: JSONBIN_CONFIG.headers,
        body: JSON.stringify({ urls: tabs.map(tab => tab.url) })
      });
      
      if (!binResponse.ok) throw new Error('Failed to create bin');
      const binData = await binResponse.json();
      
      // Create short URL using Bitly
      const bitlyResponse = await fetch(BITLY_CONFIG.baseUrl, {
        method: 'POST',
        headers: BITLY_CONFIG.headers,
        body: JSON.stringify({
          long_url: `https://api.jsonbin.io/v3/b/${binData.metadata.id}`
        })
      });
      
      if (!bitlyResponse.ok) throw new Error('Failed to create short URL');
      const bitlyData = await bitlyResponse.json();
      return bitlyData.link;
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  }
  
  export async function getSharedTabs(url) {
    try {
      const binId = url.split('/').pop();
      const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${binId}`, {
        headers: JSONBIN_CONFIG.headers
      });
      
      if (!response.ok) throw new Error('Failed to fetch shared tabs');
      const data = await response.json();
      return data.record.urls;
    } catch (error) {
      console.error('Error fetching shared tabs:', error);
      throw error;
    }
  }