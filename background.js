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
    if (existingGroup && settings.excludeFromAutoGrouping.includes(existingGroup.id)){continue}
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

        // Debugging
        // let dummyGroups = 0

        // for (let i = 0; i < dummyGroups; i++){
        //   let dummyGroup = {id:1, title:"Youtube"}
        //   groupData.push(dummyGroup)
        // }

        sendResponse(groupData)
      }
      tempFunction()
      return true
  }

});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  
  let settings = await GetSettingsFromStorage()
  if (!settings.autoGrouping){return}

  // Get the current active window
  const lastFocusedWindowObject = await getLastFocusedWindow();

  if (changeInfo.status === "complete" && !tab.pinned) {
    let tabDomain = getDomainFromURL(tab.url);
    if (!tabDomain) return;

    let allTabs = lastFocusedWindowObject.tabs;
    let groupMap = {};

    allTabs.forEach((existingTab) => {
      if (existingTab.groupId !== chrome.tabs.TAB_ID_NONE && !(settings.excludeFromAutoGrouping.includes(existingTab.groupId))) {
        let domain = getDomainFromURL(existingTab.url);
        groupMap[domain] = existingTab.groupId;
      }
    });

    if (groupMap[tabDomain] !== undefined) {
      chrome.tabs.group(
        {
          tabIds: [tabId],
          groupId: groupMap[tabDomain],
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
  }
});

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
  if (settings.excludeFromAutoGrouping.includes(group.id)){
    settings.excludeFromAutoGrouping = settings.excludeFromAutoGrouping.filter(obj => obj !== group.id)
    chrome.storage.local.set({settings})
  }

})
