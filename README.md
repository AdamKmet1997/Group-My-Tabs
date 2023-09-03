# Group My Tabs Chrome Extension

GroupMyTabs is a Chrome extension that lets users easily group their tabs by domain with just a click. This not only helps in decluttering your Chrome browser but also in streamlining your workflow by having similar tabs grouped together.

## Table of Contents

- [Installation](#installation)
- [How to Use the Extension](#how-to-use-the-extension)
- [SCSS Compilation](#scss-compilation)
- [Contribution](#contribution)

## Installation

1. **Clone the Repository**: First, clone the repository to your local machine:
   ```bash
   git clone https://github.com/AdamKmet1997/Group-My-Tabs.git
   ```

## Install SCSS (If you don't have it installed)

1. **You'll need to have SCSS installed to compile the SCSS files.**

   ```bash
   npm install -g sass
   ```

2. **Compile SCSS**: After making any changes to the styles.scss file, you can compile it to CSS using the command:

   ```bash
   npx sass styles.scss:styles.css

   ```

## Load the Extension in Chrome

1. Open the Chrome browser.

2. Go to [chrome://extensions/](chrome://extensions/).

3. Enable Developer mode by toggling the switch at the top right.

4. Click on the Load unpacked button.

5. Navigate to the directory where you cloned the repository and select it.

6. The extension will now be added to your Chrome browser.

## How to Use the Extension

1. Click on the GroupMyTabs icon in the Chrome extensions toolbar.

2. In the popup that appears, click on the "Group my tabs" button.

3. The extension will then group all your open tabs by their domain.

## SCSS Compilation

1. Navigate to the project directory in your terminal.

2. Run the following command to compile the SCSS to CSS:
   ```bash
   npx sass styles.scss:styles.css
   ```

## Contribution

Feel free to fork the project, make changes, and create a pull request. Any contribution to enhance the extension's features or fix bugs is welcome!

# Our Contributors

- [Adam Kmet](https://github.com/AdamKmet1997)
- [Gabrielius Stasaitis](https://github.com/noobgab)
