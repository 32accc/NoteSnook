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

import { SearchStorage } from "../../extensions/search-replace";
import { FloatingMenuProps } from "./types";
import { SearchReplacePopup } from "../popups/search-replace";
import { SearchReplacePopupMobile } from "../popups/search-replace.mobile";
import {
  DesktopOnly,
  MobileOnly,
  ResponsivePresenter
} from "../../components/responsive";
import { getToolbarElement } from "../utils/dom";
import ReactDOM from "react-dom";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const { isSearching } = editor.storage.searchreplace as SearchStorage;

  return (
    <>
      <DesktopOnly>
        {isSearching &&
          ReactDOM.createPortal(
            <SearchReplacePopup editor={editor} />,
            document.getElementById("editorSidebar") || document.body
          )}
      </DesktopOnly>
      <MobileOnly>
        <ResponsivePresenter
          mobile="sheet"
          isOpen={isSearching}
          onClose={() => editor.commands.endSearch()}
          position={{
            target: getToolbarElement(),
            isTargetAbsolute: true,
            location: "below",
            align: "end",
            yOffset: 5
          }}
          blocking={false}
          focusOnRender={false}
          draggable={false}
        >
          <SearchReplacePopupMobile editor={editor} />
        </ResponsivePresenter>
      </MobileOnly>
    </>
  );
}
