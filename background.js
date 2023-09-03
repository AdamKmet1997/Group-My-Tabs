function getDomainFromURL(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function getGroupForTab(groups, tab) {
  return groups.filter(group => group.tabIds.includes(tab.id))[0];
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const existingGroupsAndTabs = [];

  // Wrap the chrome API calls in Promises
  const queryGroups = () => {
    return new Promise((resolve) => {
      chrome.tabGroups.query({}, (groups) => {
        resolve(groups);
      });
    });
  };

  const queryTabs = (groupId) => {
    return new Promise((resolve) => {
      chrome.tabs.query({ groupId }, (tabs) => {
        resolve(tabs);
      });
    });
  };

  const queryAllTabs = () => {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        resolve(tabs);
      });
    });
  };

  // Wait for the groups to be fetched
  const groups = await queryGroups();

  for(let i = 0; i < groups.length; i++) {
    const group = groups[i];

    existingGroupsAndTabs.push({
      title: group.title,
      color: group.color,
      collapsed: group.collapsed,
      id: group.id,
      windowId: group.windowId,
      tabIds: []
    });

    // Wait for the tabs to be fetched for this group
    const tabs = await queryTabs(group.id);

    tabs.forEach(tab => existingGroupsAndTabs[i].tabIds.push(tab.id));
  }

  // Wait for all tabs to be fetched
  const allTabs = await queryAllTabs();
  const tabsGroupedByUrl = {};

  for(const tab of allTabs) {
    let domain = getDomainFromURL(tab.url);
    const existingGroup = getGroupForTab(existingGroupsAndTabs, tab);

    if(domain) {
      if(!tabsGroupedByUrl.hasOwnProperty(domain)) {
        const [firstLetter, ...rest] = domain.split('.')[0]
        tabsGroupedByUrl[domain] = {domain, ids: [], title: firstLetter.toUpperCase() + rest.join(''), color: null, groupId: null, collapsed: true};
      }
      tabsGroupedByUrl[domain].ids.push(tab.id);

      if(tabsGroupedByUrl[domain].groupId === null && existingGroup) {
        tabsGroupedByUrl[domain].groupId = existingGroup.id;

        if(existingGroup.color) tabsGroupedByUrl[domain].color = existingGroup.color;
        else delete tabsGroupedByUrl[domain].color

        if(existingGroup.title) tabsGroupedByUrl[domain].title = existingGroup.title;
        if('collapsed' in existingGroup) tabsGroupedByUrl[domain].collapsed = existingGroup.collapsed;
      }
    }
  }

  for(const url in tabsGroupedByUrl) {
    if(tabsGroupedByUrl[url].ids.length > 1) {
      const opts = {
        tabIds: tabsGroupedByUrl[url].ids
      };
      if(tabsGroupedByUrl[url].groupId) opts.groupId = tabsGroupedByUrl[url].groupId;

      chrome.tabs.group(
        opts,
        (groupId) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error creating group:",
              chrome.runtime.lastError.message
            );
          }

          if(!opts.groupId) {
            chrome.tabGroups.update(groupId, { title: tabsGroupedByUrl[url].title }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error updating new group title:",
                  chrome.runtime.lastError.message
                );
              }
            });

            const groupPosition = existingGroupsAndTabs.reduce((acc, obj) => {
              return acc + (obj.tabIds ? obj.tabIds.length : 0);
            }, 0);

            chrome.tabGroups.move(groupId, { index: groupPosition });
          }
        }
      );
    }
  }

  sendResponse({ status: "done" });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && !tab.pinned) {
    let tabDomain = getDomainFromURL(tab.url);
    if (!tabDomain) return;

    chrome.tabs.query({}, function (allTabs) {
      let groupMap = {};

      allTabs.forEach((existingTab) => {
        if (existingTab.groupId !== chrome.tabs.TAB_ID_NONE) {
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
    });
  }
});
