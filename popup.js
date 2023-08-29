document.getElementById("listUrls").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "listUrls" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError);
      return;
    }
  });
});
