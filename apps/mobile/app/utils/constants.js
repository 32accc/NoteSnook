/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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

import { Platform } from "react-native";

export const IOS_APPGROUPID = "group.org.streetwriters.notesnook";
export const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
export const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

export const STORE_LINK =
  Platform.OS === "ios"
    ? "https://apps.apple.com/us/app/notesnook/id1544027013"
    : "https://play.google.com/store/apps/details?id=com.streetwriters.notesnook";

export const GROUP = {
  default: "default",
  None: "none",
  abc: "abc",
  year: "year",
  week: "week",
  month: "month"
};

export const SORT = {
  dateModified: "Date modified",
  dateEdited: "Date edited",
  dateCreated: "Date created",
  title: "Title"
};

export const itemSkus = [
  "com.streetwriters.notesnook.sub.mo",
  "com.streetwriters.notesnook.sub.yr",
  "com.streetwriters.notesnook.sub.yr.15",
  "com.streetwriters.notesnook.sub.mo.15",
  "com.streetwriters.notesnook.sub.mo.ofr",
  "com.streetwriters.notesnook.sub.yr.trialoffer",
  "com.streetwriters.notesnook.sub.mo.trialoffer",
  "com.streetwriters.notesnook.sub.mo.tier1",
  "com.streetwriters.notesnook.sub.yr.tier1",
  "com.streetwriters.notesnook.sub.mo.tier2",
  "com.streetwriters.notesnook.sub.yr.tier2",
  "com.streetwriters.notesnook.sub.mo.tier3",
  "com.streetwriters.notesnook.sub.yr.tier3"
];

export const SUBSCRIPTION_STATUS = {
  BASIC: 0,
  TRIAL: 1,
  BETA: 2,
  PREMIUM: 5,
  PREMIUM_EXPIRED: 6,
  PREMIUM_CANCELLED: 7
};

export const SUBSCRIPTION_STATUS_STRINGS = {
  0: "Basic",
  1: "Trial",
  2: Platform.OS === "ios" ? "Pro" : "Beta",
  5: "Pro",
  6: "Expired",
  7: "Pro"
};

export const SUBSCRIPTION_PROVIDER = {
  0: null,
  1: {
    type: "iOS",
    title: "Subscribed on iOS",
    desc: "You subscribed to Notesnook Pro on iOS using Apple In App Purchase. You can cancel anytime with your iTunes Account settings.",
    icon: "ios"
  },
  2: {
    type: "Android",
    title: "Subscribed on Android",
    desc: "You subscribed to Notesnook Pro on Android Phone/Tablet using Google In App Purchase.",
    icon: "android"
  },
  3: {
    type: "Web",
    title: "Subscribed on Web",
    desc: "You subscribed to Notesnook Pro on the Web/Desktop App.",
    icon: "web"
  }
};

export const MenuItemsList = [
  {
    name: "Notes",
    icon: "home-variant-outline",
    close: true
  },
  {
    name: "Notebooks",
    icon: "book-outline",
    close: true
  },
  {
    name: "Favorites",
    icon: "star-outline",
    close: true
  },
  {
    name: "Tags",
    icon: "pound",
    close: true
  },
  {
    name: "Reminders",
    icon: "bell",
    close: true,
    isBeta: true
  },
  {
    name: "Monographs",
    icon: "text-box-multiple-outline",
    close: true,
    func: () => {
      const Monographs = require("../screens/notes/monographs").Monographs;
      Monographs.navigate();
    }
  },
  {
    name: "Trash",
    icon: "delete-outline",
    close: true
  }
];

export const BUTTON_TYPES = {
  transparent: {
    primary: "transparent",
    text: "accent",
    selected: "nav"
  },
  gray: {
    primary: "transparent",
    text: "icon",
    selected: "transGray"
  },
  grayBg: {
    primary: "nav",
    text: "icon",
    selected: "nav"
  },
  grayAccent: {
    primary: "nav",
    text: "accent",
    selected: "nav"
  },
  accent: (themeColor, text) => ({
    primary: themeColor,
    text: text,
    selected: themeColor
  }),
  inverted: {
    primary: "bg",
    text: "accent",
    selected: "bg"
  },
  white: {
    primary: "transparent",
    text: "light",
    selected: "transGray"
  },
  shade: {
    primary: "shade",
    text: "accent",
    selected: "accent",
    opacity: 0.12
  },
  error: {
    primary: "red",
    text: "red",
    selected: "red",
    opacity: 0.12
  },
  errorShade: {
    primary: "transparent",
    text: "red",
    selected: "red",
    opacity: 0.12
  },
  warn: {
    primary: "warningBg",
    text: "warningText",
    selected: "warningBg",
    opacity: 0.12
  }
};
