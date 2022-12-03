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
import { browser } from "webextension-polyfill-ts";
import {
  clipArticle,
  cleanup,
  clipPage,
  clipScreenshot,
  enterNodeSelectionMode
} from "@notesnook/clipper";
import { ClipArea, ClipMode } from "../common/bridge";

type ClipMessage = {
  type: "clip";
  mode?: ClipMode;
  area?: ClipArea;
};

type ViewportMessage = {
  type: "viewport";
};

browser.runtime.onMessage.addListener(async (request) => {
  const message = request as ClipMessage | ViewportMessage;

  switch (message.type) {
    case "clip": {
      const sizeable =
        message.area === "full-page" &&
        (message.mode === "complete" || message.mode === "screenshot");
      return {
        height: sizeable ? document.body.clientHeight : 0,
        width: sizeable ? document.body.clientWidth : 0,
        data: await clip(request)
      };
    }
    case "viewport":
      return {
        x: 0,
        y: 0,
        height: document.body.clientHeight,
        width: document.body.clientWidth
      };
  }
});

function clip(message: ClipMessage) {
  try {
    const isScreenshot = message.mode === "screenshot";
    const withStyles = message.mode === "complete" || isScreenshot;

    if (isScreenshot && message.area === "full-page") {
      return clipScreenshot(document.body, "jpeg");
    } else if (message.area === "full-page") {
      return clipPage(document, withStyles, false);
    } else if (message.area === "selection") {
      enterNodeSelectionMode(document).then((result) =>
        browser.runtime.sendMessage({ type: "manual", data: result })
      );
    } else if (message.area === "article") {
      return clipArticle(document, withStyles);
    } else if (message.area === "visible") {
      return clipPage(document, withStyles, true);
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (message.area !== "selection") cleanup();
  }
}
