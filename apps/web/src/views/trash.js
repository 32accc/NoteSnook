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

import * as Icon from "../components/icons";
import ListContainer from "../components/list-container";
import { confirm } from "../common/dialog-controller";
import { useStore, store } from "../stores/trash-store";
import { showToast } from "../utils/toast";
import { Text } from "@theme-ui/components";
import useNavigate from "../hooks/use-navigate";
import { db } from "../common/db";
import Placeholder from "../components/placeholders";

function Trash() {
  useNavigate("trash", async () => {
    await db.notes.init();
    store.refresh();
  });
  const items = useStore((store) => store.trash);
  const refresh = useStore((store) => store.refresh);
  const clearTrash = useStore((store) => store.clear);

  return (
    <ListContainer
      type="trash"
      groupType="trash"
      refresh={refresh}
      placeholder={<Placeholder context="trash" />}
      items={items}
      button={{
        show: !!items.length,
        content: "Clear Trash",
        icon: Icon.Trash,
        onClick: function () {
          confirm({
            title: "Clear Trash",
            subtitle: "Are you sure you want to clear all the trash?",
            positiveButtonText: "Clear trash",
            negativeButtonText: "Cancel",
            message: `Are you sure you want to proceed? **This action is IRREVERSIBLE**.`
          }).then(async (res) => {
            if (res) {
              try {
                await clearTrash();
                showToast("success", "Trash cleared successfully!");
              } catch (e) {
                showToast(
                  "error",
                  `Could not clear trash. Error: ${e.message}`
                );
              }
            }
          });
        }
      }}
    />
  );
}
export default Trash;
