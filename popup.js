// Prevents the code from breaking if the class names change
const UI = {
  group_tabs_btn: document.querySelector(".group-tabs-btn")
}

UI.group_tabs_btn.addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "listUrls" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError);
      return;
    }
  });
});
