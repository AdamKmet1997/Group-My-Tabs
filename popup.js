const UI = {
  group_tabs_btn: document.querySelector("#listUrls"),
  settingsPageBtn: document.querySelector(".settings-page-btn"),
  settingsPageContainer: document.querySelector(".settings-container"),
  mainContainer: document.querySelector(".main-container"),
  groupsContainer: document.querySelector(".groups-container"),
  autoGroupingToggle: document.querySelector("#auto-grouping-toggle"),
  settingsPageOverlay: document.querySelector(".overlay")
};

let SETTINGS = {excludeFromAutoGrouping:[]}
// settings =  {
//   autoGrouping: true / false
// }

InitSettings()
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

  UI.autoGroupingToggle.addEventListener("change", () => {
    
    if (UI.autoGroupingToggle.checked){
      // Toggle On
      SETTINGS.autoGrouping = true
      UI.settingsPageOverlay.classList.add("hide")
    } else {
      // Toggle Off
      SETTINGS.autoGrouping = false
      UI.settingsPageOverlay.classList.remove("hide")
    }

    chrome.storage.local.set({settings: SETTINGS})

  })
}

async function InitSettings(){
    let {settings} = await chrome.storage.local.get("settings")
    // ==== TEMP ==== 

    if (!settings){return}

    // ==== TEMP ==== 


    if (settings.autoGrouping){
      // Toggle On
      UI.autoGroupingToggle.checked = true
      UI.settingsPageOverlay.classList.add("hide")
    } else {
      // Toggle Off
      UI.autoGroupingToggle.checked = false
      UI.settingsPageOverlay.classList.remove("hide")
    }

    SETTINGS = settings

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
      let checkBox = groupContainer.querySelector("input")

      if (SETTINGS.excludeFromAutoGrouping.includes(id)){
        checkBox.checked = false
      } else {
        checkBox.checked = true
      }

      checkBox.addEventListener("change", () => {

        if (checkBox.checked){

          SETTINGS.excludeFromAutoGrouping = SETTINGS.excludeFromAutoGrouping.filter(obj => obj !== id)

        } else {
          if (!(SETTINGS.excludeFromAutoGrouping.includes(id))){
            SETTINGS.excludeFromAutoGrouping.push(id)
          }
        }

        chrome.storage.local.set({settings: SETTINGS})

      })

      UI.groupsContainer.appendChild(groupContainer)

    })

  })
}
