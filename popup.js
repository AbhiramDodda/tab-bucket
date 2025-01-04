document.addEventListener('DOMContentLoaded', function() {
    let groups = [];
    let openTabs = [];
    const root = document.getElementById('root');

    // Initialize the popup
    async function init() {
        await loadGroups();
        await loadOpenTabs();
        render();
    }

    // Load open tabs
    async function loadOpenTabs() {
        openTabs = await chrome.tabs.query({ currentWindow: true });
    }

    // Load groups from storage
    function loadGroups() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['tabGroups'], function(result) {
                groups = result.tabGroups || [{
                    id: Date.now(),
                    name: 'Default Group',
                    tabs: []
                }];
                resolve();
            });
        });
    }

    // Save groups to storage
    function saveGroups() {
        chrome.storage.local.set({ tabGroups: groups }, function() {
            render();
        });
    }

    // Check if tab already exists in group
    function isTabInGroup(groupId, tabUrl) {
        const group = groups.find(g => g.id === groupId);
        return group ? group.tabs.some(t => t.url === tabUrl) : false;
    }

    // Add selected tab to group
    function addSelectedTab(groupId, tabId) {
        const tab = openTabs.find(t => t.id === parseInt(tabId));
        if (!tab) return;

        if (isTabInGroup(groupId, tab.url)) {
            showNotification('Tab already exists in this group', 'warning');
            return;
        }

        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
            groups[groupIndex].tabs.push({
                id: Date.now(),
                title: tab.title,
                url: tab.url,
                favicon: tab.favIconUrl
            });
            saveGroups();
            showNotification('Tab added successfully', 'success');
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = {
            'success': 'bg-green-500',
            'warning': 'bg-yellow-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500'
        }[type] || 'bg-green-500';
        
        notification.className = `fixed top-2 right-2 ${bgColor} text-white px-4 py-2 rounded shadow-lg z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async function shareGroup(groupId) {
        const group = groups.find(g => g.id === groupId);
        if (!group || group.tabs.length === 0) {
            showNotification('No tabs to share in this group', 'warning');
            return;
        }
    
        showNotification('Generating share link...', 'info');
    
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CREATE_SHARE_LINK',
                tabs: group.tabs
            });
    
            if (response && response.shortUrl) {
                await navigator.clipboard.writeText(response.shortUrl);
                showNotification('Link copied to clipboard!', 'success');
            } else {
                showNotification('Error creating share link', 'error');
            }
        } catch (error) {
            showNotification('Error sharing group', 'error');
            console.error('Share error:', error);
        }
    }

    // Other existing functions (removeTab, addGroup, removeGroup, shareGroup) remain the same...

    // Render the popup
    function render() {
        const html = `
            <div class="p-4">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-xl font-bold">Tab Collector</h1>
                    <button id="addGroup" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        New Group
                    </button>
                </div>
                <div class="space-y-4">
                    ${groups.map(group => `
                        <div class="border rounded p-3" data-group-id="${group.id}">
                            <div class="flex justify-between items-center mb-2">
                                <h2 class="font-medium">${group.name}</h2>
                                <div class="space-x-2 flex items-center">
                                    <select class="tab-select p-1 border rounded text-sm" aria-label="Select tab to add">
                                        <option value="">Select tab to add...</option>
                                        ${openTabs.map(tab => `
                                            <option value="${tab.id}" ${isTabInGroup(group.id, tab.url) ? 'disabled' : ''}>
                                                ${tab.title}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <button class="share-group bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">
                                        Share
                                    </button>
                                    <button class="remove-group bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-2">
                                ${group.tabs.length === 0 ? 
                                    '<p class="text-gray-500 text-sm italic">No tabs added yet</p>' :
                                    group.tabs.map(tab => `
                                        <div class="flex items-center justify-between bg-gray-50 p-2 rounded" data-tab-id="${tab.id}">
                                            <div class="flex items-center flex-1 min-w-0">
                                                ${tab.favicon ? 
                                                    `<img src="${tab.favicon}" class="w-4 h-4 mr-2" alt="favicon" />` :
                                                    '<div class="w-4 h-4 mr-2"></div>'
                                                }
                                                <div class="flex flex-col min-w-0">
                                                    <span class="text-sm font-medium truncate">${tab.title}</span>
                                                    <a href="${tab.url}" class="text-xs text-gray-500 truncate hover:text-blue-500" target="_blank">
                                                        ${tab.url}
                                                    </a>
                                                </div>
                                            </div>
                                            <button class="remove-tab text-red-500 hover:text-red-600 ml-2">×</button>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        root.innerHTML = html;

        // Add event listeners
        document.getElementById('addGroup').addEventListener('click', addGroup);

        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                const tabId = e.target.value;
                if (!tabId) return;
                
                const groupId = parseInt(e.target.closest('[data-group-id]').dataset.groupId);
                addSelectedTab(groupId, tabId);
                e.target.value = ''; // Reset select after adding
            });
        });

        // Add other existing event listeners (share-group, remove-group, remove-tab)...
        document.querySelectorAll('.share-group').forEach(button => {
            button.addEventListener('click', (e) => {
                const groupId = parseInt(e.target.closest('[data-group-id]').dataset.groupId);
                shareGroup(groupId);
            });
        });

        document.querySelectorAll('.remove-group').forEach(button => {
            button.addEventListener('click', (e) => {
                const groupId = parseInt(e.target.closest('[data-group-id]').dataset.groupId);
                removeGroup(groupId);
            });
        });

        document.querySelectorAll('.remove-tab').forEach(button => {
            button.addEventListener('click', (e) => {
                const groupId = parseInt(e.target.closest('[data-group-id]').dataset.groupId);
                const tabId = parseInt(e.target.closest('[data-tab-id]').dataset.tabId);
                removeTab(groupId, tabId);
            });
        });
    }

    // Initialize the popup
    init();
});