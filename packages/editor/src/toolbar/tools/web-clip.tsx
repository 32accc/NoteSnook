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

import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode, selectionToOffset } from "../utils/prosemirror";

export function WebClipSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("webclip") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="webclipSettings"
      tools={["webclipFullScreen"]}
    />
  );
}

export function WebClipFullScreen(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        const dom = editor.current?.view.nodeDOM(
          selectionToOffset(editor.state).from
        );
        if (!dom || !(dom instanceof HTMLElement)) return;

        const iframe = dom.querySelector("iframe");
        if (!iframe) return;

        iframe.requestFullscreen();
        editor.current?.commands.updateAttributes("webclip", {
          fullscreen: true
        });
      }}
    />
  );
}

export function WebClipOpenExternal(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={async () => {
        const dom = editor.current?.view.nodeDOM(
          selectionToOffset(editor.state).from
        );
        if (!dom || !(dom instanceof HTMLElement)) return;

        const iframe = dom.querySelector("iframe");
        if (!iframe || !iframe.contentDocument) return;

        const url = URL.createObjectURL(
          new Blob(
            ["\ufeff", iframe.contentDocument.documentElement.outerHTML],
            { type: "text/html" }
          )
        );
        editor.current?.commands.openLink(url);
      }}
    />
  );
}

export function WebClipOpenSource(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={async () => {
        const node = findSelectedNode(editor, "webclip");
        if (!node) return;
        editor.current?.commands.openLink(node.attrs.src);
      }}
    />
  );
}
