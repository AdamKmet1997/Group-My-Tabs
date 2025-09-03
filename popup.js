// Modern UI Controller for Group My Tabs Extension

class TabGroupManager {
  constructor() {
    this.UI = {
      // Theme
      themeToggle: document.querySelector("#theme-toggle"),
      sunIcon: document.querySelector(".sun-icon"),
      moonIcon: document.querySelector(".moon-icon"),
      
      // Main actions
      groupTabsButton: document.querySelector("#listUrls"),
      btnText: document.querySelector(".btn-text"),
      loadingSpinner: document.querySelector(".loading-spinner"),
      statsText: document.querySelector("#stats-text"),
      
      // Settings
      settingsPageButton: document.querySelector(".settings-page-btn"),
      homeIcon: document.querySelector(".home-icon"),
      settingsIcon: document.querySelector(".settings-page-icon"),
      settingsPageContainer: document.querySelector(".settings-container"),
      mainContainer: document.querySelector(".main-container"),
      autoGroupingToggle: document.querySelector("#auto-grouping-toggle"),
      
      // Bulk actions
      enableAllBtn: document.querySelector("#enable-all-groups"),
      disableAllBtn: document.querySelector("#disable-all-groups"),
      
      // Pagination
      nextGroupPageButton: document.querySelector(".next-page"),
      previousGroupPageButton: document.querySelector(".previous-page"),
      pageNumbers: document.querySelector(".page-numbers"),
      
      // Notifications
      notification: document.querySelector("#notification"),
      notificationText: document.querySelector(".notification-text"),
      notificationClose: document.querySelector(".notification-close"),
      
      // Other
      noGroupsText: document.querySelector(".no-groups-text")
    };

    this.settings = {};
    this.groupsContainer = {};
    this.currentPage = 1;
    this.totalPages = 0;
    this.isLoading = false;

    this.init();
  }

  async init() {
    await this.initSettings();
    await this.initTheme();
    await this.loadGroupData();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    
    // Add animation classes
    document.body.classList.add('animate-in');
  }

  // Theme Management
  async initTheme() {
    const theme = await this.getStoredTheme();
    this.applyTheme(theme);
  }

  async getStoredTheme() {
    try {
      const result = await chrome.storage.local.get("theme");
      return result.theme || "light";
    } catch (error) {
      console.error("Error getting theme:", error);
      return "light";
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      this.UI.sunIcon.classList.add('hide');
      this.UI.moonIcon.classList.remove('hide');
    } else {
      this.UI.sunIcon.classList.remove('hide');
      this.UI.moonIcon.classList.add('hide');
    }
  }

  async toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.applyTheme(newTheme);
    
    try {
      await chrome.storage.local.set({ theme: newTheme });
    } catch (error) {
      this.showNotification("Failed to save theme preference", "error");
    }
  }

  // Notification System
  showNotification(message, type = "info", duration = 4000) {
    this.UI.notificationText.textContent = message;
    this.UI.notification.className = `notification show ${type}`;
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => this.hideNotification(), duration);
    }
  }

  hideNotification() {
    this.UI.notification.classList.remove('show');
  }

  // Settings Management
  async initSettings() {
    try {
      let { settings } = await chrome.storage.local.get("settings");
      
      if (!settings) {
        settings = {
          autoGrouping: true,
          excludeFromAutoGrouping: [],
          theme: "light",
          keyboardShortcuts: true
        };
        await chrome.storage.local.set({ settings });
      }
      
      if (!settings.excludeFromAutoGrouping) {
        settings.excludeFromAutoGrouping = [];
        await chrome.storage.local.set({ settings });
      }
      
      this.settings = settings;
      
      // Apply UI state
      if (this.UI.autoGroupingToggle) {
        this.UI.autoGroupingToggle.checked = settings.autoGrouping;
      }
      
    } catch (error) {
      console.error("Error initializing settings:", error);
      this.showNotification("Failed to load settings", "error");
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      await chrome.storage.local.set({ settings: this.settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      this.showNotification("Failed to save settings", "error");
    }
  }

  // Loading State Management
  setLoadingState(isLoading, customText = null) {
    this.isLoading = isLoading;
    this.UI.groupTabsButton.disabled = isLoading;
    
    if (isLoading) {
      this.UI.btnText.textContent = customText || "Grouping...";
      this.UI.loadingSpinner.classList.remove('hide');
    } else {
      this.UI.btnText.textContent = "Group My Tabs";
      this.UI.loadingSpinner.classList.add('hide');
    }
  }

  // Group Management
  async loadGroupData() {
    try {
      const response = await this.sendMessage({ action: "getGroupData" });
      this.displayGroups(response);
      this.updateStats(response.length);
    } catch (error) {
      console.error("Error loading group data:", error);
      this.showNotification("Failed to load groups", "error");
    }
  }

  displayGroups(groups) {
    // Clear existing containers
    this.clearGroupContainers();
    
    if (groups.length === 0) {
      this.UI.noGroupsText.classList.remove("hide");
      return;
    }
    
    this.UI.noGroupsText.classList.add("hide");
    
    const itemsPerPage = 8;
    this.totalPages = Math.ceil(groups.length / itemsPerPage);
    
    for (let page = 1; page <= this.totalPages; page++) {
      const startIndex = (page - 1) * itemsPerPage;
      const pageGroups = groups.slice(startIndex, startIndex + itemsPerPage);
      
      this.createGroupPage(page, pageGroups);
    }
    
    this.updatePagination();
    this.showPage(1);
  }

  createGroupPage(pageNumber, groups) {
    const groupContainer = document.createElement("div");
    groupContainer.classList.add("groups-container");
    groupContainer.id = `page-${pageNumber}`;
    
    if (pageNumber !== 1) {
      groupContainer.classList.add("hide");
    }
    
    groups.forEach((group) => {
      const groupElement = this.createGroupElement(group);
      groupContainer.appendChild(groupElement);
    });
    
    // Insert before pagination
    const paginationContainer = document.querySelector(".pagination-container");
    paginationContainer.parentNode.insertBefore(groupContainer, paginationContainer);
    
    this.groupsContainer[pageNumber] = groupContainer;
  }

  createGroupElement(groupData) {
    const { id, title } = groupData;
    
    const group = document.createElement("div");
    group.classList.add("group");
    
    // Truncate and clean title
    let displayTitle = title && title.trim() ? title : "Untitled";
    if (displayTitle.length > 20) {
      displayTitle = displayTitle.slice(0, 20) + "...";
    }
    
    group.innerHTML = `
      <span class="group-name" title="${title || 'Untitled'}">${displayTitle}</span>
      <label for="${id}" class="toggle-container">
        <input type="checkbox" id="${id}" class="toggle-input">
        <div class="toggle-fill"></div>
      </label>
    `;
    
    const checkbox = group.querySelector("input");
    checkbox.checked = !this.settings.excludeFromAutoGrouping.includes(id);
    
    checkbox.addEventListener("change", () => this.handleGroupToggle(id, checkbox.checked));
    
    return group;
  }

  async handleGroupToggle(groupId, isEnabled) {
    try {
      let newExcludeList = [...this.settings.excludeFromAutoGrouping];
      
      if (isEnabled) {
        newExcludeList = newExcludeList.filter(id => id !== groupId);
      } else {
        if (!newExcludeList.includes(groupId)) {
          newExcludeList.push(groupId);
        }
      }
      
      await this.updateSettings({ excludeFromAutoGrouping: newExcludeList });
      
      this.showNotification(
        `Group ${isEnabled ? 'enabled' : 'disabled'} for auto-grouping`,
        "success",
        2000
      );
    } catch (error) {
      console.error("Error toggling group:", error);
      this.showNotification("Failed to update group setting", "error");
    }
  }


  // Bulk Operations
  async handleBulkAction(action) {
    const allGroups = document.querySelectorAll('.group input[type="checkbox"]');
    const isEnabling = action === 'enable';
    
    try {
      this.setLoadingState(true, isEnabling ? "Enabling all..." : "Disabling all...");
      
      // Update all checkboxes
      allGroups.forEach(checkbox => {
        checkbox.checked = isEnabling;
      });
      
      // Update settings
      const newExcludeList = isEnabling 
        ? [] 
        : Array.from(allGroups).map(cb => cb.id);
        
      await this.updateSettings({ excludeFromAutoGrouping: newExcludeList });
      
      this.showNotification(
        `All groups ${isEnabling ? 'enabled' : 'disabled'}`,
        "success",
        2000
      );
    } catch (error) {
      console.error(`Error ${action} all groups:`, error);
      this.showNotification(`Failed to ${action} all groups`, "error");
    } finally {
      this.setLoadingState(false);
    }
  }

  // Pagination
  updatePagination() {
    this.UI.pageNumbers.innerHTML = '';
    
    for (let i = 1; i <= this.totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = 'page-number';
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => this.showPage(i));
      
      if (i === this.currentPage) {
        pageBtn.classList.add('current-page-number');
      }
      
      this.UI.pageNumbers.appendChild(pageBtn);
    }
    
    // Update navigation buttons
    this.UI.previousGroupPageButton.disabled = this.currentPage === 1;
    this.UI.nextGroupPageButton.disabled = this.currentPage === this.totalPages;
  }

  showPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > this.totalPages) return;
    
    // Hide current page
    if (this.groupsContainer[this.currentPage]) {
      this.groupsContainer[this.currentPage].classList.add('hide');
    }
    
    // Show new page
    this.currentPage = pageNumber;
    if (this.groupsContainer[this.currentPage]) {
      this.groupsContainer[this.currentPage].classList.remove('hide');
    }
    
    this.updatePagination();
  }

  // Main Action
  async groupTabs() {
    if (this.isLoading) return;
    
    try {
      this.setLoadingState(true);
      
      await this.sendMessage({ action: "listUrls" });
      
      // Reload group data to reflect changes
      await this.loadGroupData();
      
      this.showNotification("Tabs grouped successfully!", "success", 3000);
      this.updateStats();
      
    } catch (error) {
      console.error("Error grouping tabs:", error);
      this.showNotification("Failed to group tabs", "error");
    } finally {
      this.setLoadingState(false);
    }
  }

  // Utilities
  clearGroupContainers() {
    Object.values(this.groupsContainer).forEach(container => {
      container.remove();
    });
    this.groupsContainer = {};
  }

  updateStats(groupCount = null) {
    if (groupCount !== null) {
      this.UI.statsText.textContent = groupCount === 0 
        ? "No groups yet" 
        : `${groupCount} group${groupCount === 1 ? '' : 's'} found`;
    } else {
      this.UI.statsText.textContent = "Ready to group";
    }
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  }

  // Event Listeners
  setupEventListeners() {
    // Theme toggle
    this.UI.themeToggle?.addEventListener("click", () => this.toggleTheme());
    
    // Main group action
    this.UI.groupTabsButton?.addEventListener("click", () => this.groupTabs());
    
    // Settings page toggle
    this.UI.settingsPageButton?.addEventListener("click", () => {
      this.UI.settingsPageContainer.classList.toggle("hide");
      this.UI.mainContainer.classList.toggle("hide");
      this.UI.settingsIcon.classList.toggle("hide");
      this.UI.homeIcon.classList.toggle("hide");
    });
    
    // Auto-grouping toggle
    this.UI.autoGroupingToggle?.addEventListener("change", async () => {
      await this.updateSettings({ autoGrouping: this.UI.autoGroupingToggle.checked });
      this.showNotification(
        `Auto-grouping ${this.UI.autoGroupingToggle.checked ? 'enabled' : 'disabled'}`,
        "success",
        2000
      );
    });
    
    // Bulk actions
    this.UI.enableAllBtn?.addEventListener("click", () => this.handleBulkAction('enable'));
    this.UI.disableAllBtn?.addEventListener("click", () => this.handleBulkAction('disable'));
    
    // Pagination
    this.UI.nextGroupPageButton?.addEventListener("click", () => {
      this.showPage(this.currentPage + 1);
    });
    
    this.UI.previousGroupPageButton?.addEventListener("click", () => {
      this.showPage(this.currentPage - 1);
    });
    
    // Notifications
    this.UI.notificationClose?.addEventListener("click", () => this.hideNotification());
    
    // Auto-hide notifications on click outside
    document.addEventListener("click", (e) => {
      if (!this.UI.notification.contains(e.target)) {
        this.hideNotification();
      }
    });
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only process shortcuts if enabled
      if (!this.settings.keyboardShortcuts) return;
      
      // Cmd/Ctrl + G - Group tabs
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        this.groupTabs();
        return;
      }
      
      // Cmd/Ctrl + D - Toggle theme
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        this.toggleTheme();
        return;
      }
      
      // Escape - Close notifications or go back
      if (e.key === 'Escape') {
        if (!this.UI.notification.classList.contains('hide')) {
          this.hideNotification();
        } else if (!this.UI.settingsPageContainer.classList.contains('hide')) {
          this.UI.settingsPageButton.click();
        }
        return;
      }
      
      // Arrow keys for pagination (when settings open)
      if (!this.UI.settingsPageContainer.classList.contains('hide')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.showPage(this.currentPage - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.showPage(this.currentPage + 1);
        }
      }
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TabGroupManager();
});

// Add some helpful console logs for debugging
if (chrome.runtime?.getManifest) {
  console.log('Group My Tabs Extension loaded:', chrome.runtime.getManifest().version);
}