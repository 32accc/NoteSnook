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

import ListItem from "../list-item";
import { showMultiPermanentDeleteConfirmation } from "../../common/dialog-controller";
import { Restore, DeleteForver } from "../icons";
import { store } from "../../stores/trash-store";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { pluralize, toTitleCase } from "@notesnook/common";
import { showUndoableToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { hashNavigate } from "../../navigation";
import { useStore } from "../../stores/note-store";
import { MenuItem } from "@notesnook/ui";
import { TrashItem } from "@notesnook/core/dist/types";

type TrashItemProps = { item: TrashItem; date: number };
function TrashItem(props: TrashItemProps) {
  const { item, date } = props;
  const isOpened = useStore((store) => store.selectedNote === item.id);

  return (
    <ListItem
      isFocused={isOpened}
      item={item}
      title={item.title}
      body={item.itemType === "note" ? item.headline : item.description}
      footer={
        <Flex
          mt={1}
          sx={{ fontSize: "subBody", color: "var(--paragraph-secondary)" }}
        >
          <TimeAgo live={true} datetime={date} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text sx={{ color: "accent" }}>
            {toTitleCase(item.itemType as string)}
          </Text>
        </Flex>
      }
      menuItems={menuItems}
      onClick={() => {
        if (item.itemType === "note")
          hashNavigate(`/notes/${item.id}/edit`, { replace: true });
      }}
    />
  );
}
export default TrashItem;

const menuItems: (item: TrashItem, items?: TrashItem[]) => MenuItem[] = (
  item,
  items = []
) => {
  return [
    {
      type: "button",
      key: "restore",
      title: "Restore",
      icon: Restore.path,
      onClick: () => {
        store.restore(items.map((i) => i.id));
        showToast("success", `${pluralize(items.length, "item")} restored`);
      },
      multiSelect: true
    },
    {
      type: "button",
      key: "delete",
      title: "Delete",
      icon: DeleteForver.path,
      variant: "dangerous",
      onClick: async () => {
        if (!(await showMultiPermanentDeleteConfirmation(items.length))) return;
        const ids = items.map((i) => i.id);
        showUndoableToast(
          `${pluralize(items.length, "item")} permanently deleted`,
          () => store.delete(ids),
          () => store.delete(ids, true),
          () => store.refresh()
        );
      },
      multiSelect: true
    }
  ];
};
