/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
const ICONS = {
  16: "16x16.png",
  32: "32x32.png",
  48: "48x48.png",
  64: "64x64.png",
  128: "128x128.png",
  256: "256x256.png"
};
const BACKGROUND_SCRIPT = "background.bundle.js";
const ACTION = {
  default_icon: ICONS,
  default_title: "Notesnook Web Clipper",
  default_popup: "popup.html"
};

const common = {
  name: "Notesnook Web Clipper",
  version: "1.0",
  description: "Clip web pages.",
  permissions: [
    "activeTab",
    "tabs",
    "storage",
    "contextMenus",
    "notifications"
  ],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmXQb9xwsSWbvAbBVnWa+DwsXLtRLbjfLyWRZtT5KF8bjCrEg3InvntWlk1PrNo73lsTov1m8Y5K9fJcCVKuYZkTCmNf4iGsHqOafi9ny5MX53oQ53+/s7gao2ZicHtTylnCIqn8f/l+RkV3tHO8BwANDLX2TTe7zCYLzFH19jiKAI+7qmUDZvyCH/OMVohluUCQO94s7sghslalwPbAcQQLpAKxYdd5GJDn4FryitsCMTYX962X+O6Tivq2QPML/Gm7BrZqJsU1enFRH1ss0UK0b9COpEYqqPhZ+GJP5K6WOL46NX+CvZnQmux1ehTZgIhw64IQJ57TvG2kIQTA8ZQIDAQAB",
  content_scripts: [
    {
      js: ["nnContentScript.bundle.js"],
      matches: ["*://app.notesnook.com/*", "*://localhost/*"]
    },
    {
      js: ["contentScript.bundle.js"],
      matches: ["http://*/*", "https://*/*"],
      exclude_matches: ["*://app.notesnook.com/*", "*://localhost/*"]
    },
  ],
  browser_specific_settings: {
    gecko: {
      strict_min_version: "105.0"
    }
  },
  icons: ICONS,
};

const v2 = {
  ...common,
  manifest_version: 2,
  background: {
    scripts: [BACKGROUND_SCRIPT]
  },
  browser_action: ACTION
};

const v3 = {
  ...common,
  manifest_version: 3,
  background: {
    service_worker: BACKGROUND_SCRIPT
  },
  action: ACTION
};

module.exports = {
  v2,
  v3
};
