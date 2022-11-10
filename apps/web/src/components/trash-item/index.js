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

import ListItem from "../list-item";
import { showMultiPermanentDeleteConfirmation } from "../../common/dialog-controller";
import * as Icon from "../icons";
import { store } from "../../stores/trash-store";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { pluralize, toTitleCase } from "../../utils/string";
import { showUndoableToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { hashNavigate } from "../../navigation";
import { useStore } from "../../stores/note-store";

function TrashItem({ item, index, date }) {
  const isOpened = useStore((store) => store.selectedNote === item.id);

  return (
    <ListItem
      selectable
      isFocused={isOpened}
      item={item}
      title={item.title}
      body={item.headline || item.description}
      index={index}
      footer={
        <Flex mt={1} sx={{ fontSize: "subBody", color: "fontTertiary" }}>
          <TimeAgo live={true} datetime={date} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text sx={{ color: "primary" }}>{toTitleCase(item.itemType)}</Text>
        </Flex>
      }
      menu={{ items: menuItems, extraData: { item } }}
      onClick={() => {
        hashNavigate(`/notes/${item.id}/edit`, { replace: true });
      }}
    />
  );
}
export default TrashItem;

const menuItems = [
  {
    key: "restore",
    title: "Restore",
    icon: Icon.Restore,
    onClick: ({ items }) => {
      store.restore(items.map((i) => i.id));
      showToast(
        "success",
        `${pluralize(items.length, "item", "items")} restored`
      );
    },
    multiSelect: true
  },
  {
    key: "delete",
    title: "Delete",
    icon: Icon.DeleteForver,
    color: "error",
    iconColor: "error",
    onClick: async ({ items }) => {
      if (!(await showMultiPermanentDeleteConfirmation(items.length))) return;
      const ids = items.map((i) => i.id);
      showUndoableToast(
        `${pluralize(items.length, "item", "items")} permanently deleted`,
        () => store.delete(ids),
        () => store.delete(ids, true),
        () => store.refresh()
      );
    },
    multiSelect: true
  }
];
