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

import { Flex, Text } from "@theme-ui/components";
import { ReactNodeViewProps } from "../react";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { findChildren, findChildrenInRange } from "@tiptap/core";
import { useCallback } from "react";
import { TaskItemNode, TaskItemAttributes } from "./task-item";
import {
  useIsKeyboardOpen,
  useIsMobile
} from "../../toolbar/stores/toolbar-store";
import { isiOS } from "../../utils/platform";

export function TaskItemComponent(
  props: ReactNodeViewProps<TaskItemAttributes>
) {
  const { editor, updateAttributes, getPos, forwardRef } = props;
  const { checked } = props.node.attrs;
  const isMobile = useIsMobile();

  const toggle = useCallback(() => {
    if (!editor.isEditable || !editor.current) return false;

    const { empty, from, to } = editor.current.state.selection;
    if (!empty) {
      const selectedTaskItems = findChildrenInRange(
        editor.current.state.doc,
        { from, to },
        (node) => node.type.name === TaskItemNode.name
      );
      editor.current.commands.command(({ tr }) => {
        for (const { node, pos } of selectedTaskItems) {
          tr.setNodeMarkup(pos, null, { checked: !checked });
          toggleChildren(node, tr, !checked, pos);
        }
        return true;
      });
    } else {
      updateAttributes({ checked: !checked });

      const pos = getPos();
      const node = editor.current?.state.doc.nodeAt(pos);
      if (!node) return false;

      editor.commands.command(({ tr }) => {
        toggleChildren(node, tr, !checked, pos);
        return true;
      });
    }

    return true;
  }, [editor, checked, updateAttributes, getPos]);

  return (
    <>
      <Flex
        data-drag-image
        sx={{
          bg: "background",
          borderRadius: "default",
          ":hover > .dragHandle": {
            opacity: editor.isEditable ? 1 : 0
          }
        }}
      >
        {editor.isEditable && (
          <Icon
            className="dragHandle"
            draggable="true"
            // NOTE: Turning this off somehow makes drag/drop stop working
            // properly on touch devices.
            // contentEditable={false}
            data-drag-handle
            path={Icons.dragHandle}
            sx={{
              opacity: [1, 1, 0],
              alignSelf: "start",
              mr: 2,
              bg: "transparent",
              cursor: "grab",
              ".icon:hover path": {
                fill: "var(--checked) !important"
              }
            }}
            size={isMobile ? 24 : 20}
          />
        )}
        <Icon
          path={checked ? Icons.check : ""}
          stroke="1px"
          contentEditable={false}
          tabIndex={1}
          sx={{
            border: "2px solid",
            borderColor: checked ? "checked" : "icon",
            borderRadius: "default",
            alignSelf: "start",
            mr: 2,
            p: "1px",
            cursor: editor.isEditable ? "pointer" : "unset",
            ":hover": {
              borderColor: "checked"
            },
            ":hover .icon path": {
              fill: "var(--checked) !important"
            }
          }}
          onMouseDown={(e) => {
            if (useIsKeyboardOpen.current) {
              e.preventDefault();
            }
            toggle();
          }}
          onTouchEnd={(e) => {
            if (useIsKeyboardOpen.current || isiOS()) {
              e.preventDefault();
              toggle();
            }
          }}
          color={checked ? "checked" : "icon"}
          size={isMobile ? 16 : 14}
        />

        <Text
          as="div"
          ref={forwardRef}
          sx={{
            "> .taskitem-content-wrapper > p": {
              textDecorationLine: checked ? "line-through" : "none",
              opacity: checked ? 0.8 : 1
            },
            // FIXME: this is quite fragile and will break if the structure
            // changes. We should probably find a better & more robust
            // solution for this.
            "> .taskitem-content-wrapper > p:hover ~ div > div.task-list-tools .toggleSublist":
              {
                opacity: 1
              },
            flex: 1
          }}
        />
      </Flex>
    </>
  );
}

function toggleChildren(
  node: Node,
  tr: Transaction,
  toggleState: boolean,
  parentPos: number
): Transaction {
  const children = findChildren(
    node,
    (node) => node.type.name === TaskItemNode.name
  );

  for (const { pos } of children) {
    // need to add 1 to get inside the node
    const actualPos = pos + parentPos + 1;
    tr.setNodeMarkup(actualPos, undefined, {
      checked: toggleState
    });
  }
  return tr;
}
