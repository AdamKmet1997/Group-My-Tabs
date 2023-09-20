const UI = {
  group_tabs_btn: document.querySelector("#listUrls"),
  settingsPageBtn: document.querySelector(".settings-page-btn"),
  settingsPageContainer: document.querySelector(".settings-container"),
  mainContainer: document.querySelector(".main-container")
};

AddEventListeners()

function AddEventListeners(){
  UI.group_tabs_btn.addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "listUrls" }, function (response) {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        return;
      }
    });
  });
  
  UI.settingsPageBtn.addEventListener("click", () => {
    UI.settingsPageContainer.classList.toggle("hide")
    UI.mainContainer.classList.toggle("hide")
  })
}
