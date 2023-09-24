const UI = {
  groupTabsButton: document.querySelector("#listUrls"),
  settingsPageButton: document.querySelector(".settings-page-btn"),

  homeIcon: document.querySelector(".home-icon"),
  settingsIcon: document.querySelector(".settings-page-icon"),

  settingsPageContainer: document.querySelector(".settings-container"),
  mainContainer: document.querySelector(".main-container"),
  
  autoGroupingToggle: document.querySelector("#auto-grouping-toggle"),

  nextGroupPageButton: document.querySelector(".change-page-container .next-page"),
  previousGroupPageButton: document.querySelector(".change-page-container .previous-page"),

  noGroupsText: document.querySelector(".no-groups-text")
};

// The settings are first initialized in the background when the extension first runs
let SETTINGS = {excludeFromAutoGrouping:[]}
// settings =  {
//   autoGrouping: true / false,
//   excludeFromAutoGrouping:[]
// }

let GROUPS_PAGES_CONTAINER = {}

InitSettings()
AddGroupNames()
AddEventListeners()



function AddEventListeners(){

      UI.groupTabsButton.addEventListener("click", function () {
        chrome.runtime.sendMessage({ action: "listUrls" }, function (response) {
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError);
            return;
          }
        });
      });
      
      UI.settingsPageButton.addEventListener("click", () => {
        UI.settingsPageContainer.classList.toggle("hide")
        UI.mainContainer.classList.toggle("hide")
        UI.settingsIcon.classList.toggle("hide")
        UI.homeIcon.classList.toggle("hide")
      })

      UI.autoGroupingToggle.addEventListener("change", () => {
        
        if (UI.autoGroupingToggle.checked){
          // Toggle On
          SETTINGS.autoGrouping = true
        } else {
          // Toggle Off
          SETTINGS.autoGrouping = false
        }

        chrome.storage.local.set({settings: SETTINGS})

      })


      UI.nextGroupPageButton.addEventListener("click", () => {
        let currentPageNumber = Number(document.querySelector(".page-number.current-page-number").textContent)
        let nextPageNumber =  currentPageNumber + 1
        //  Reset the styling of the current page's number and add styling to the next page's number
        SwitchGroupContainerPage({currentPageNumber,nextPageNumber})

      })

      UI.previousGroupPageButton.addEventListener("click", () => {
        let currentPageNumber = Number(document.querySelector(".page-number.current-page-number").textContent)
        let nextPageNumber =  currentPageNumber - 1
        //  Reset the styling of the current page's number and add styling to the next page's number
        SwitchGroupContainerPage({currentPageNumber,nextPageNumber})
      
      })


}

async function InitSettings(){
    let {settings} = await chrome.storage.local.get("settings")

    // Return if for whatever reason settings is null
    if (!settings){return}

    if (settings.autoGrouping){
      // Toggle On
      UI.autoGroupingToggle.checked = true
    } else {
      // Toggle Off
      UI.autoGroupingToggle.checked = false
    }

    SETTINGS = settings

}

function AddGroupNames(){
  let action = "getGroupData"
  chrome.runtime.sendMessage({action}, (response) => {
    
    let currentGroupPageNumber = 0
    let currentNumOfGroupsInPage = 0
    let groupPageElement, newPageNumberElement

    if (response.length === 0){
      UI.noGroupsText.classList.remove("hide")
    } else{
      UI.noGroupsText.classList.remove("add")
    }

    response.forEach(({id, title}) => {

       // If there is no page or the current page is full with 8 groups (4 rows)
      if (currentGroupPageNumber === 0 || currentNumOfGroupsInPage === 8){
        //Create a new group (new page)
        currentGroupPageNumber++

        groupPageElement = document.createElement("div")
        groupPageElement.classList.add("groups-container")
        groupPageElement.id = `page-${currentGroupPageNumber}`

        // Create a new number in the "switch page" section
        newPageNumberElement = document.createElement("button")
        newPageNumberElement.classList.add("page-number")
        newPageNumberElement.id = `page-${currentGroupPageNumber}`
        newPageNumberElement.textContent = currentGroupPageNumber

        if (currentGroupPageNumber === 1){
          newPageNumberElement.classList.add("current-page-number")
        } else {
          groupPageElement.classList.add("hide")
        }

        newPageNumberElement.addEventListener("click",(element) => {
          // Change page when the number is clicked
          let nextPageNumber = element.target.id.split("-")[1]
          let currentPageNumber = Number(document.querySelector(".page-number.current-page-number").textContent)
          SwitchGroupContainerPage({currentPageNumber,nextPageNumber})
        })

        // Insert them
        UI.settingsPageContainer.insertBefore(groupPageElement, document.querySelector(".change-page-container"))
        document.querySelector(".change-page-container").insertBefore(newPageNumberElement, UI.nextGroupPageButton)

        // To make them accessible later on
        GROUPS_PAGES_CONTAINER[currentGroupPageNumber] = {groupPageElement,pageNumberElement:newPageNumberElement}
        
        currentNumOfGroupsInPage = 0
      }

      // Create an individual group
      let group = document.createElement("div")
      group.classList.add("group")

      // Truncate the group name if too long

      if (title.length > 17){
        title = title.slice(0,17)
      }

      if (title.trim() === ""){
        title = "Untitled"
      }

      group.innerHTML = `
      <span class=group-name>${title}</span>
      <label for="${id}" class="toggle-container">
        <input type="checkbox", id="${id}", class="toggle-input">
        <div class="toggle-fill"></div>
      </label>
      `   
      let checkBox = group.querySelector("input")

      // Check if it was toggled on or off
      if (SETTINGS.excludeFromAutoGrouping.includes(id)){
        checkBox.checked = false
      } else {
        checkBox.checked = true
      }

      checkBox.addEventListener("change", () => {
        // Toggle the group and save 
        if (checkBox.checked){
          // Remove the id from the array
          SETTINGS.excludeFromAutoGrouping = SETTINGS.excludeFromAutoGrouping.filter(obj => obj !== id)
        } else {
          if (!(SETTINGS.excludeFromAutoGrouping.includes(id))){
            SETTINGS.excludeFromAutoGrouping.push(id)
          }
        }

        chrome.storage.local.set({settings: SETTINGS})

      })

      groupPageElement.appendChild(group)

      currentNumOfGroupsInPage++
    })

  })
}

function SwitchGroupContainerPage({currentPageNumber, nextPageNumber}){
  // Return if there's only 1 page
  if (currentPageNumber == nextPageNumber){return}

  // The `nextPageNumber` indicates the page to navigate to
  let nextGroupsPageElement = GROUPS_PAGES_CONTAINER[nextPageNumber]?.groupPageElement

  // True indicates that the limit page has been reached
  if (!nextGroupsPageElement){return}
  
  let currentGroupPageElement = GROUPS_PAGES_CONTAINER[currentPageNumber].groupPageElement

  // Hide the current page and un-hide the next page
  currentGroupPageElement.classList.add("hide")
  nextGroupsPageElement.classList.remove("hide")

  let nextGroupsPageNumberElement = GROUPS_PAGES_CONTAINER[nextPageNumber].pageNumberElement
  let currentGroupsPageNumberElement = GROUPS_PAGES_CONTAINER[currentPageNumber].pageNumberElement

  // Update the visual representation of the current and next page numbers in the pagination
  nextGroupsPageNumberElement.classList.add("current-page-number")
  currentGroupsPageNumberElement.classList.remove("current-page-number")

}
