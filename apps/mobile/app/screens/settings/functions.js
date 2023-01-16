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

import { presentDialog } from "../../components/dialog/functions";
import { ToastEvent } from "../../services/event-manager";
import { db } from "../../common/database";
import { sleep } from "../../utils/time";

export async function verifyUser(
  context,
  onsuccess,
  disableBackdropClosing,
  onclose,
  closeText
) {
  presentDialog({
    context: context,
    title: "Verify it's you",
    input: true,
    inputPlaceholder: "Enter account password",
    paragraph: "Please enter your account password",
    positiveText: "Verify",
    secureTextEntry: true,
    disableBackdropClosing: disableBackdropClosing,
    onClose: onclose,
    negativeText: closeText || "Cancel",
    positivePress: async (value) => {
      try {
        let verified = await db.user.verifyPassword(value);
        if (verified) {
          sleep(300).then(async () => {
            await onsuccess();
          });
        } else {
          ToastEvent.show({
            heading: "Incorrect password",
            message: "The account password you entered is incorrect",
            type: "error",
            context: "global"
          });
          return false;
        }
      } catch (e) {
        ToastEvent.show({
          heading: "Failed to backup data",
          message: e.message,
          type: "error",
          context: "global"
        });
        return false;
      }
    }
  });
}
