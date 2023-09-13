const UI = {
  group_tabs_btn: document.querySelector("#listUrls"),
};

UI.group_tabs_btn.addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "listUrls" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError);
      return;
    }
  });
});
