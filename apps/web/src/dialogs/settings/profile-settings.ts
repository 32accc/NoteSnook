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

import { useStore as useUserStore } from "../../stores/user-store";
import { SettingsGroup } from "./types";
import { showPasswordDialog } from "../../dialogs/password-dialog";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { UserProfile } from "./components/user-profile";
import { verifyAccount } from "../../common";
import { EmailChangeDialog } from "../email-change-dialog";
import {
  showClearSessionsConfirmation,
  showLogoutConfirmation
} from "../confirm";
import { TaskManager } from "../../common/task-manager";
import { AttachmentsDialog } from "../attachments-dialog";
import { RecoveryKeyDialog } from "../recovery-key-dialog";

export const ProfileSettings: SettingsGroup[] = [
  {
    key: "user-profile",
    section: "profile",
    header: UserProfile,
    onStateChange(listener) {
      return useUserStore.subscribe((s) => s.isLoggedIn, listener);
    },
    settings: [
      {
        key: "email",
        title: "Email",
        description: "Set a new email for your account",
        keywords: ["change email", "new email"],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            title: "Change email",
            variant: "secondary",
            action: () => EmailChangeDialog.show({})
          }
        ]
      },
      {
        key: "manage-attachments",
        title: "Attachments",
        description: "Manage all your attachments in one place.",
        components: [
          {
            type: "button",
            title: "Open manager",
            variant: "secondary",
            action: () => AttachmentsDialog.show({})
          }
        ]
      },
      {
        key: "recovery-key",
        title: "Recovery key",
        description:
          "In case you lose your password, this data recovery key is the only way to recovery your data.",
        keywords: ["data recovery key", "lose your password", "backup"],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            title: "Backup your recovery key",
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) await RecoveryKeyDialog.show({});
            }
          }
        ]
      },
      {
        key: "account-removal",
        title: "Account removal",
        description:
          "Permanently delete your account clearing all data including your notes, notebooks, and attachments.",
        keywords: ["delete account", "clear data"],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            variant: "error",
            title: "Delete account",
            action: () =>
              showPasswordDialog({
                title: "Delete your account",
                message: ` All your data will be permanently deleted with **no way of recovery**. Proceed with caution.`,
                inputs: {
                  password: {
                    label: "Password",
                    autoComplete: "current-password"
                  }
                },
                validate: async ({ password }) => {
                  await db.user.deleteUser(password);
                  return true;
                }
              })
          }
        ]
      }
    ]
  },
  {
    key: "user-sessions",
    section: "profile",
    header: "Sessions",
    onStateChange(listener) {
      return useUserStore.subscribe((s) => s.isLoggedIn, listener);
    },
    isHidden: () => !useUserStore.getState().isLoggedIn,
    settings: [
      {
        key: "logout",
        title: "Logout",
        description:
          "Logging out will clear all data stored on THIS DEVICE. Make sure you have synced all your changes before logging out.",
        keywords: [],
        components: [
          {
            type: "button",
            variant: "errorSecondary",
            title: "Logout",
            action: async () => {
              if (await showLogoutConfirmation()) {
                await TaskManager.startTask({
                  type: "modal",
                  title: "You are being logged out",
                  subtitle: "Please wait...",
                  action: () => db.user.logout(true)
                });
                showToast("success", "You have been logged out.");
              }
            }
          }
        ]
      },
      {
        key: "logout-all-sessions",
        title: "Log out from all other devices",
        description: "Force logout from all your other logged in devices.",
        keywords: ["clear sessions"],
        components: [
          {
            type: "button",
            variant: "errorSecondary",
            title: "Log out all other devices",
            action: async () => {
              if (!(await showClearSessionsConfirmation())) return;

              await db.user.clearSessions();
              showToast(
                "success",
                "You have been logged out from all other devices."
              );
            }
          }
        ]
      }
    ]
  }
];
