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

import { db } from "../../common/database";
import { validateAppLockPassword } from "../../common/database/encryption";
import { presentDialog } from "../../components/dialog/functions";
import BiometricService from "../../services/biometrics";
import { ToastManager } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useUserStore } from "../../stores/use-user-store";
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
        const user = await db.user.getUser();
        let verified = !user ? true : await db.user.verifyPassword(value);
        if (verified) {
          sleep(300).then(async () => {
            await onsuccess();
          });
        } else {
          ToastManager.show({
            heading: "Incorrect password",
            message: "The account password you entered is incorrect",
            type: "error",
            context: "global"
          });
          return false;
        }
      } catch (e) {
        ToastManager.show({
          heading: "Failed to verify",
          message: e.message,
          type: "error",
          context: "global"
        });
        return false;
      }
    }
  });
}

export async function verifyUserWithApplock() {
  const keyboardType = SettingsService.getProperty("applockKeyboardType");
  return new Promise((resolve) => {
    if (SettingsService.getProperty("appLockHasPasswordSecurity")) {
      presentDialog({
        title: "Verify it's you",
        input: true,
        inputPlaceholder: `Enter app lock ${
          keyboardType === "numeric" ? "pin" : "password"
        }`,
        paragraph: `Please enter your app lock ${
          keyboardType === "numeric" ? "pin" : "password"
        }`,
        positiveText: "Verify",
        secureTextEntry: true,
        negativeText: "Cancel",
        keyboardType: keyboardType,
        positivePress: async (value) => {
          try {
            const verified = await validateAppLockPassword(value);
            if (!verified) {
              ToastManager.show({
                heading: `Invalid ${
                  keyboardType === "numeric" ? "pin" : "password"
                }`,
                type: "error",
                context: "local"
              });
              return false;
            }
            resolve(verified);
          } catch (e) {
            resolve(false);
            return false;
          }
          return true;
        }
      });
    } else {
      BiometricService.isBiometryAvailable().then((available) => {
        if (available) {
          BiometricService.validateUser("Verify it's you").then((verified) => {
            resolve(verified);
          });
        } else if (useUserStore.getState().user) {
          let verified = false;
          verifyUser(
            null,
            () => {
              resolve(true);
            },
            false,
            () => {
              resolve(verified);
            }
          );
        } else {
          resolve(true);
        }
      });
    }
  });
}
