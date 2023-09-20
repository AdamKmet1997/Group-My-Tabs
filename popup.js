const UI = {
  group_tabs_btn: document.querySelector("#listUrls"),
  settingsPageBtn: document.querySelector(".settings-page-btn"),
  settingsPageContainer: document.querySelector(".settings-container"),
  mainContainer: document.querySelector(".main-container"),
  groupsContainer: document.querySelector(".groups-container")
};

AddEventListeners()
AddGroupNames()


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

function BackgroundListeners(){

  chrome.runtime.onMessage((message, sender, sendResponse) => {

    let action = message.action

    switch (action) {
      case "groupData":
        console.log(message.groupData)
        break;
    
      default:
        break;
    }

  })

}

function AddGroupNames(){
  let action = "getGroupData"
  chrome.runtime.sendMessage({action}, (response) => {
    
    response.forEach(({id, title}) => {


      let groupContainer = document.createElement("div")
      groupContainer.classList.add("group")

      groupContainer.innerHTML = `
      ${title}
      <label for="${id}" class="toggle-container">
        <input type="checkbox", id="${id}", class="toggle-input">
        <div class="toggle-fill"></div>
      </label>
      `
      UI.groupsContainer.appendChild(groupContainer)

    })

  })
}

function SendRequestToBackground({type, payload}){
  chrome.runtime.sendMessage(type,payload)
}
