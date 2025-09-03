# Group My Tabs Chrome Extension

GroupMyTabs is a comprehensive Chrome extension that enhances your browsing productivity by automatically organizing tabs into groups by domain. With advanced features like session management, tab search, analytics, and intelligent auto-grouping, it transforms your browser into an organized workspace.

## ✨ Features

### 🗂️ **Tab Management**
- **One-click grouping** - Instantly group all tabs by domain
- **Smart auto-grouping** - Automatically group new tabs as you browse
- **Selective group control** - Enable/disable auto-grouping for specific groups
- **Bulk actions** - Enable or disable all groups at once
- **Context menu integration** - Right-click to group similar tabs or tabs from specific domains

### 🔍 **Tab Search & Navigation**
- **Fast tab search** - Quickly find tabs by title or URL across all windows
- **Real-time filtering** - Instant results as you type
- **Cross-window search** - Find tabs in any Chrome window
- **Visual previews** - See tab favicons and titles in search results

### 💾 **Session Management**
- **Save sessions** - Capture your current tab groups and windows
- **Restore sessions** - Recreate your saved browsing sessions
- **Session library** - Manage multiple saved sessions
- **Smart restoration** - Maintains group organization when restoring
- **Context menu saving** - Quick save from right-click menu

### 📊 **Analytics Dashboard**
- **Usage statistics** - Track total tabs, groups, and productivity metrics
- **Memory insights** - Estimated memory usage and savings from grouping
- **Session analytics** - Count of saved and loaded sessions
- **Activity tracking** - Last used date and usage patterns

### ⚙️ **Settings & Customization**
- **Auto-grouping toggle** - Enable/disable automatic grouping globally
- **Group management** - Fine-tune which groups participate in auto-grouping
- **Theme options** - Switch between light and dark modes
- **Keyboard shortcuts** - Quick access to main functions

### 🎨 **Modern Interface**
- **Responsive design** - Clean, modern popup interface
- **Pagination** - Organized display for large numbers of groups
- **Visual feedback** - Loading states and success notifications
- **Accessibility** - Screen reader support and keyboard navigation
- **Theme support** - Automatic dark/light mode switching

## Table of Contents

- [Installation](#installation)
- [Features Overview](#features-overview)
- [How to Use](#how-to-use)
- [Development](#development)
- [Contribution](#contribution)

## Installation

### 📦 **Quick Setup**
1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdamKmet1997/Group-My-Tabs.git
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the cloned directory
   - The extension icon will appear in your Chrome toolbar

### 🔧 **For Developers**
If you plan to modify styles:
```bash
npm install -g sass
```

## 📋 **Permissions**
The extension requires these Chrome permissions:
- **tabs**: Read and manage browser tabs
- **tabGroups**: Create and modify tab groups  
- **storage**: Save settings and sessions locally
- **contextMenus**: Add right-click menu options
- **windows**: Access multiple Chrome windows

## How to Use

### 🚀 **Getting Started**
1. Click on the Group My Tabs icon in the Chrome extensions toolbar
2. Click "Group My Tabs" to instantly organize all tabs by domain
3. Toggle individual groups on/off to control auto-grouping behavior

### 🔍 **Using Tab Search**
1. Click the search icon in the popup
2. Type to search across all tabs by title or URL
3. Click any result to switch to that tab instantly
4. Use the close button or press Escape to exit search

### 💾 **Managing Sessions**
1. Enter a session name in the input field
2. Click "Save Current" to save your tab groups and layout
3. Click "Load" on any saved session to restore it
4. Use "Delete" to remove sessions you no longer need

### 📊 **Viewing Analytics**
1. Click the analytics icon to open your productivity dashboard
2. View statistics about your tab usage and grouping efficiency
3. Monitor memory usage and savings from tab grouping
4. Track your session creation and usage patterns

### ⚙️ **Configuring Settings**
1. Click the settings icon to access preferences
2. Toggle auto-grouping on/off globally
3. Switch between light and dark themes
4. Enable/disable individual groups from auto-grouping

### 🖱️ **Using Context Menus**
1. Right-click on any webpage to access grouping options
2. Select "Group similar tabs" to group tabs from the current domain
3. Use "Group all tabs from this domain" for domain-specific grouping
4. Choose "Save current session" for quick session saving

## Development

### 🛠️ **Technical Stack**
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **APIs Used**: Chrome Tabs API, TabGroups API, Storage API, ContextMenus API, Windows API
- **Architecture**: Service Worker background script, popup-based UI

### 📋 **Prerequisites**
- Node.js and npm installed
- Chrome browser with Developer mode enabled
- Basic knowledge of Chrome Extensions API

### ⚙️ **Setup for Development**
1. Clone the repository:
   ```bash
   git clone https://github.com/AdamKmet1997/Group-My-Tabs.git
   cd Group-My-Tabs
   ```

2. Install SCSS compiler (if you plan to modify styles):
   ```bash
   npm install -g sass
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

### 🎨 **SCSS Compilation**
If you modify the styles, compile SCSS to CSS:
```bash
npx sass styles.scss:styles.css
```

### 📁 **Project Structure**
```
Group-My-Tabs/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background logic)
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── styles.css            # Compiled CSS styles
├── images/               # Extension icons
└── README.md            # This file
```

### 🚀 **Key Components**
- **background.js**: Handles tab grouping logic, auto-grouping, context menus, and data storage
- **popup.js**: Manages the popup UI, user interactions, and communication with background script
- **popup.html**: Extension popup interface with modern responsive design
- **styles.css**: Comprehensive styling with dark/light theme support

## Contribution

Feel free to fork the project, make changes, and create a pull request. Any contribution to enhance the extension's features or fix bugs is welcome!
