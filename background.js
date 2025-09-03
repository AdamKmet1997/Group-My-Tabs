function getDomainFromURL(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

function getGroupForTab(groups, tab) {
  return groups.filter((group) => group.tabIds.includes(tab.id))[0];
}

// Added this function to retrieve the "Last Focused Window" (which basically is the current active window)
function getLastFocusedWindow() {
  return new Promise((resolve, reject) => {
    chrome.windows.getLastFocused({ populate: true }, (window) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(window);
      }
    });
  });
}

// Get all groups in the CURRENT Window
const queryGroups = (windowId) => {
    return new Promise((resolve) => {
      chrome.tabGroups.query({ windowId }, (groups) => {
        resolve(groups);
      });
    });
  };

async function GetSettingsFromStorage(){
    let {settings} = await chrome.storage.local.get("settings")
    
    // Initialize default settings if null
    if (!settings) {
      settings = {
        autoGrouping: true,
        excludeFromAutoGrouping: [],
        theme: "light"
      }
      await chrome.storage.local.set({settings})
    }
    
    // Ensure all properties exist
    if (!settings.excludeFromAutoGrouping) {
      settings.excludeFromAutoGrouping = []
    }
    if (!settings.theme) {
      settings.theme = "light"
    }
    
    // Save updated settings if any properties were missing
    await chrome.storage.local.set({settings})
    
    return settings
  }

  
async function groupTabsWhenButtonClicked(sendResponse){

  let settings = await GetSettingsFromStorage()
  const existingGroupsAndTabs = [];

  // Get the last focused (current) window
  const lastFocusedWindowObject = await getLastFocusedWindow();
  const lastFocusedWindowID = lastFocusedWindowObject.id;

  // Wrap the chrome API calls in Promises
  // Get all tabs in a group in the CURRENT Window
  const queryTabs = (groupId, windowId) => {
    return new Promise((resolve) => {
      chrome.tabs.query({ groupId, windowId }, (tabs) => {
        resolve(tabs);
      });
    });
  };

  // Get all tabs in the CURRENT Window
  const queryAllTabs = () => {
    return lastFocusedWindowObject.tabs;
  };

  // Wait for the groups to be fetched
  const groups = await queryGroups(lastFocusedWindowID);

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];


    existingGroupsAndTabs.push({
      title: group.title,
      color: group.color,
      collapsed: group.collapsed,
      id: group.id,
      windowId: group.windowId,
      tabIds: [],
    });

    // Wait for the tabs to be fetched for this group
    const tabs = await queryTabs(group.id, lastFocusedWindowID);
    tabs.forEach((tab) => existingGroupsAndTabs[existingGroupsAndTabs.length - 1].tabIds.push(tab.id));
  }


  // Wait for all tabs to be fetched
  const allTabs = await queryAllTabs();
  const tabsGroupedByUrl = {};
  for (const tab of allTabs) {
    let domain = getDomainFromURL(tab.url);
    const existingGroup = getGroupForTab(existingGroupsAndTabs, tab);
    if (existingGroup && settings.excludeFromAutoGrouping && settings.excludeFromAutoGrouping.includes(existingGroup.id)){continue}
    if (domain) {
      if (!tabsGroupedByUrl.hasOwnProperty(domain)) {
        const [firstLetter, ...rest] = domain.split(".")[0];
        tabsGroupedByUrl[domain] = {
          domain,
          ids: [],
          title: firstLetter.toUpperCase() + rest.join(""),
          color: null,
          groupId: null,
          collapsed: true,
        };
      }
      tabsGroupedByUrl[domain].ids.push(tab.id);

      if (tabsGroupedByUrl[domain].groupId === null && existingGroup) {
        tabsGroupedByUrl[domain].groupId = existingGroup.id;

        if (existingGroup.color)
          tabsGroupedByUrl[domain].color = existingGroup.color;
        else delete tabsGroupedByUrl[domain].color;

        if (existingGroup.title)
          tabsGroupedByUrl[domain].title = existingGroup.title;
        if ("collapsed" in existingGroup)
          tabsGroupedByUrl[domain].collapsed = existingGroup.collapsed;
      }
    }
  }

  for (const url in tabsGroupedByUrl) {
    if (tabsGroupedByUrl[url].ids.length > 1) {
      const opts = {
        tabIds: tabsGroupedByUrl[url].ids,
      };
      if (tabsGroupedByUrl[url].groupId)
        opts.groupId = tabsGroupedByUrl[url].groupId;

      chrome.tabs.group(opts, (groupId) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error creating group:",
            chrome.runtime.lastError.message
          );
        }

        if (!opts.groupId) {
          chrome.tabGroups.update(
            groupId,
            { title: tabsGroupedByUrl[url].title },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error updating new group title:",
                  chrome.runtime.lastError.message
                );
              }
            }
          );

          const groupPosition = existingGroupsAndTabs.reduce((acc, obj) => {
            return acc + (obj.tabIds ? obj.tabIds.length : 0);
          }, 0);

          chrome.tabGroups.move(groupId, { index: groupPosition });
        }
      });
    }
  }

  // Track analytics
  const groupedDomains = Object.keys(tabsGroupedByUrl).filter(domain => tabsGroupedByUrl[domain].ids.length > 1)
  if (groupedDomains.length > 0) {
    await trackAnalytic('tabsGrouped')
  }

  sendResponse({ status: "done" });
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      let action = message.action
      let tempFunction
  switch (action) {
    
    case "listUrls":
      tempFunction = async () => {
        await groupTabsWhenButtonClicked(sendResponse)
      }
      tempFunction()
      return true
    
    
    case "getGroupData":
        tempFunction = async () => {
        let windowObj = await getLastFocusedWindow()
        let groupData = await queryGroups(windowObj.id)

        sendResponse(groupData)
      }
      tempFunction()
      return true

    case "searchTabs":
      tempFunction = async () => {
        const { query } = message
        const allTabs = await chrome.tabs.query({})
        const filteredTabs = allTabs.filter(tab => 
          tab.title.toLowerCase().includes(query.toLowerCase()) ||
          tab.url.toLowerCase().includes(query.toLowerCase())
        )
        sendResponse(filteredTabs)
      }
      tempFunction()
      return true

    case "saveSession":
      tempFunction = async () => {
        const { sessionName } = message
        await saveCurrentSession(sessionName)
        sendResponse({ success: true })
      }
      tempFunction()
      return true

    case "loadSession":
      tempFunction = async () => {
        const { sessionName } = message
        await loadSession(sessionName)
        sendResponse({ success: true })
      }
      tempFunction()
      return true

    case "getSessions":
      tempFunction = async () => {
        const sessions = await getSavedSessions()
        sendResponse(sessions)
      }
      tempFunction()
      return true

    case "deleteSession":
      tempFunction = async () => {
        const { sessionName } = message
        await deleteSession(sessionName)
        sendResponse({ success: true })
      }
      tempFunction()
      return true

    case "getAnalytics":
      tempFunction = async () => {
        const analytics = await getAnalyticsData()
        sendResponse(analytics)
      }
      tempFunction()
      return true

  }

});


chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  
  let settings = await GetSettingsFromStorage()
  if (!settings || !settings.autoGrouping){return}

  // Only process tabs in the correct window
  if (changeInfo.status === "complete" && !tab.pinned && tab.windowId) {
    let tabDomain = getDomainFromURL(tab.url);
    if (!tabDomain) return;

    // Get fresh window and group data to avoid race conditions
    let currentWindow;
    try {
      currentWindow = await new Promise((resolve, reject) => {
        chrome.windows.get(tab.windowId, { populate: true }, (window) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(window);
          }
        });
      });
    } catch (error) {
      console.error("Error getting window:", error);
      return;
    }

    // Build group map from current window state
    let groupMap = {};
    let excludedGroups = new Set(settings.excludeFromAutoGrouping);

    currentWindow.tabs.forEach((existingTab) => {
      if (existingTab.groupId !== chrome.tabs.TAB_ID_NONE && !excludedGroups.has(existingTab.groupId)) {
        let domain = getDomainFromURL(existingTab.url);
        if (domain) {
          groupMap[domain] = existingTab.groupId;
        }
      }
    });

    if (groupMap[tabDomain] !== undefined) {
      // Verify the target group still exists before moving
      chrome.tabGroups.get(groupMap[tabDomain], (targetGroup) => {
        if (chrome.runtime.lastError) {
          console.log("Target group no longer exists, skipping auto-grouping");
          return;
        }
        
        // Double-check the group isn't excluded (in case it was just disabled)
        if (!excludedGroups.has(targetGroup.id)) {
          chrome.tabs.group(
            {
              tabIds: [tabId],
              groupId: targetGroup.id,
            },
            function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error moving tab to group:",
                  chrome.runtime.lastError.message
                );
              }
            }
          );
        }
      });
    }
  }
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "groupSimilarTabs",
    title: "Group similar tabs",
    contexts: ["page"]
  })
  
  chrome.contextMenus.create({
    id: "groupByDomain",
    title: "Group all tabs from this domain",
    contexts: ["page"]
  })
  
  chrome.contextMenus.create({
    id: "separator1",
    type: "separator",
    contexts: ["page"]
  })
  
  chrome.contextMenus.create({
    id: "saveCurrentSession",
    title: "Save current session",
    contexts: ["page"]
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "groupSimilarTabs":
      await groupTabsWhenButtonClicked(() => {})
      break
    case "groupByDomain":
      await groupTabsByDomain(tab.url)
      break
    case "saveCurrentSession":
      await saveCurrentSession(`Session ${new Date().toLocaleString()}`)
      break
  }
})

// Group tabs by specific domain
async function groupTabsByDomain(url) {
  const domain = getDomainFromURL(url)
  if (!domain) return

  const allTabs = await chrome.tabs.query({})
  const domainTabs = allTabs.filter(tab => getDomainFromURL(tab.url) === domain)
  
  if (domainTabs.length > 1) {
    const groupId = await chrome.tabs.group({ tabIds: domainTabs.map(t => t.id) })
    await chrome.tabGroups.update(groupId, { 
      title: domain.charAt(0).toUpperCase() + domain.slice(1).replace('.com', ''),
      collapsed: false
    })
  }
}

// Session Management Functions
async function saveCurrentSession(sessionName) {
  try {
    const windows = await chrome.windows.getAll({ populate: true })
    const sessionData = {
      name: sessionName,
      timestamp: Date.now(),
      windows: []
    }

    for (const window of windows) {
      const windowData = {
        id: window.id,
        tabs: [],
        groups: []
      }

      // Get tab groups for this window
      const groups = await queryGroups(window.id)
      for (const group of groups) {
        const groupTabs = await chrome.tabs.query({ groupId: group.id, windowId: window.id })
        windowData.groups.push({
          title: group.title,
          color: group.color,
          collapsed: group.collapsed,
          tabIds: groupTabs.map(tab => ({
            url: tab.url,
            title: tab.title,
            pinned: tab.pinned
          }))
        })
      }

      // Get ungrouped tabs
      const ungroupedTabs = window.tabs.filter(tab => tab.groupId === chrome.tabs.TAB_ID_NONE)
      windowData.tabs = ungroupedTabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        pinned: tab.pinned
      }))

      sessionData.windows.push(windowData)
    }

    // Save session
    const { sessions = {} } = await chrome.storage.local.get("sessions")
    sessions[sessionName] = sessionData
    await chrome.storage.local.set({ sessions })

    // Track analytics
    await trackAnalytic('sessionSaved')

  } catch (error) {
    console.error('Error saving session:', error)
  }
}

async function loadSession(sessionName) {
  try {
    const { sessions } = await chrome.storage.local.get("sessions")
    if (!sessions || !sessions[sessionName]) return

    const sessionData = sessions[sessionName]

    // Create new windows for the session
    for (const windowData of sessionData.windows) {
      const tabUrls = []
      
      // Collect all tab URLs from groups and ungrouped tabs
      windowData.groups.forEach(group => {
        group.tabIds.forEach(tab => tabUrls.push(tab.url))
      })
      windowData.tabs.forEach(tab => tabUrls.push(tab.url))

      if (tabUrls.length === 0) continue

      // Create window with first tab
      const newWindow = await chrome.windows.create({ url: tabUrls[0] })
      
      // Add remaining tabs
      for (let i = 1; i < tabUrls.length; i++) {
        await chrome.tabs.create({ windowId: newWindow.id, url: tabUrls[i] })
      }

      // Recreate groups after tabs are loaded
      setTimeout(async () => {
        const allTabs = await chrome.tabs.query({ windowId: newWindow.id })
        let tabIndex = 0

        for (const groupData of windowData.groups) {
          const groupTabIds = []
          for (let i = 0; i < groupData.tabIds.length; i++) {
            if (allTabs[tabIndex]) {
              groupTabIds.push(allTabs[tabIndex].id)
              tabIndex++
            }
          }
          
          if (groupTabIds.length > 1) {
            const groupId = await chrome.tabs.group({ tabIds: groupTabIds })
            await chrome.tabGroups.update(groupId, {
              title: groupData.title,
              color: groupData.color,
              collapsed: groupData.collapsed
            })
          }
        }
      }, 2000)
    }

    // Track analytics
    await trackAnalytic('sessionLoaded')

  } catch (error) {
    console.error('Error loading session:', error)
  }
}

async function getSavedSessions() {
  const { sessions = {} } = await chrome.storage.local.get("sessions")
  return Object.keys(sessions).map(name => ({
    name,
    timestamp: sessions[name].timestamp,
    windowCount: sessions[name].windows.length,
    tabCount: sessions[name].windows.reduce((total, win) => 
      total + win.tabs.length + win.groups.reduce((groupTotal, group) => 
        groupTotal + group.tabIds.length, 0), 0)
  }))
}

async function deleteSession(sessionName) {
  const { sessions = {} } = await chrome.storage.local.get("sessions")
  delete sessions[sessionName]
  await chrome.storage.local.set({ sessions })
}

// Analytics Functions
async function trackAnalytic(action) {
  const { analytics = {} } = await chrome.storage.local.get("analytics")
  
  if (!analytics[action]) {
    analytics[action] = 0
  }
  analytics[action]++
  
  analytics.lastUsed = Date.now()
  await chrome.storage.local.set({ analytics })
}

async function getAnalyticsData() {
  const { analytics = {} } = await chrome.storage.local.get("analytics")
  const windows = await chrome.windows.getAll({ populate: true })
  
  let totalTabs = 0
  let totalGroups = 0
  let groupedTabs = 0
  
  for (const window of windows) {
    totalTabs += window.tabs.length
    const groups = await queryGroups(window.id)
    totalGroups += groups.length
    
    for (const group of groups) {
      const groupTabs = await chrome.tabs.query({ groupId: group.id })
      groupedTabs += groupTabs.length
    }
  }
  
  const memoryEstimate = totalTabs * 50 // Rough estimate: 50MB per tab
  const memorySaved = (analytics.tabsGrouped || 0) * 20 // Estimate savings from grouping
  
  return {
    totalTabs,
    totalGroups,
    groupedTabs,
    ungroupedTabs: totalTabs - groupedTabs,
    tabsGrouped: analytics.tabsGrouped || 0,
    sessionsCreated: analytics.sessionSaved || 0,
    sessionsLoaded: analytics.sessionLoaded || 0,
    memoryEstimate: `${Math.round(memoryEstimate)}MB`,
    memorySaved: `${Math.round(memorySaved)}MB`,
    lastUsed: analytics.lastUsed ? new Date(analytics.lastUsed).toLocaleDateString() : 'Never'
  }
}

// Initialize Settings
self.addEventListener("activate", async () => {
  
    // Check if settings have been initialized

    let {settings} = await chrome.storage.local.get("settings")

    if (settings){return}

    // Initialize Settings

    settings = {
      autoGrouping: true,
      excludeFromAutoGrouping:[]
    }

    await chrome.storage.local.set({settings})

});

chrome.tabGroups.onRemoved.addListener(async (group) => {
  let settings = await GetSettingsFromStorage()

  // Remove this group from excluded groups if present
  if (settings.excludeFromAutoGrouping && settings.excludeFromAutoGrouping.includes(group.id)){
    settings.excludeFromAutoGrouping = settings.excludeFromAutoGrouping.filter(obj => obj !== group.id)
    chrome.storage.local.set({settings})
  }

})
