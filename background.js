function getDomainFromURL(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.tabs.query({}, (tabs) => {
    let tabsGroupedByURL = {};
    for (let tab of tabs) {
      let domain = getDomainFromURL(tab.url);
      if (domain) {
        if (!tabsGroupedByURL[domain]) {
          tabsGroupedByURL[domain] = [];
        }
        tabsGroupedByURL[domain].push(tab.id);
      }
    }

    for (let url in tabsGroupedByURL) {
      if (tabsGroupedByURL[url].length > 1) {
        chrome.tabs.group(
          {
            tabIds: tabsGroupedByURL[url],
          },
          (groupId) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error creating group:",
                chrome.runtime.lastError.message
              );
            }
          }
        );
      }
    }
  });

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
