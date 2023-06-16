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

import React, { useEffect } from "react";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import { useStore as useThemeStore } from "./stores/theme-store";
import { useStore as useAttachmentStore } from "./stores/attachment-store";
import { useStore as useEditorStore } from "./stores/editor-store";
import { useStore as useAnnouncementStore } from "./stores/announcement-store";
import { resetReminders, scheduleBackups } from "./common/reminders";
import { introduceFeatures, showUpgradeReminderDialogs } from "./common";
import { AppEventManager, AppEvents } from "./common/app-events";
import { db } from "./common/db";
import { EV, EVENTS } from "@notesnook/core/common";
import { registerKeyMap } from "./common/key-map";
import { isUserPremium } from "./hooks/use-is-user-premium";
import {
  showAnnouncementDialog,
  showBuyDialog,
  showFeatureDialog,
  showInvalidSystemTimeDialog,
  showOnboardingDialog
} from "./common/dialog-controller";
import useSystemTheme from "./hooks/use-system-theme";
import { isTesting } from "./utils/platform";
import { updateStatus, removeStatus, getStatus } from "./hooks/use-status";
import { showToast } from "./utils/toast";
import { interruptedOnboarding } from "./components/dialogs/onboarding-dialog";
import { hashNavigate } from "./navigation";
import { desktop } from "./common/desktop-bridge";

export default function AppEffects({ setShow }) {
  const refreshNavItems = useStore((store) => store.refreshNavItems);
  const updateLastSynced = useStore((store) => store.updateLastSynced);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initStore = useStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const initAttachments = useAttachmentStore((store) => store.init);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const setTheme = useThemeStore((store) => store.setTheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const initEditorStore = useEditorStore((store) => store.init);
  const dialogAnnouncements = useAnnouncementStore(
    (store) => store.dialogAnnouncements
  );
  const isSystemThemeDark = useSystemTheme();

  useEffect(
    function initializeApp() {
      const userCheckStatusEvent = EV.subscribe(
        EVENTS.userCheckStatus,
        async (type) => {
          if (isUserPremium()) {
            return { type, result: true };
          } else {
            showToast(
              "error",
              "Please upgrade your account to Pro to use this feature.",
              [{ text: "Upgrade now", onClick: () => showBuyDialog() }]
            );
            return { type, result: false };
          }
        }
      );

      initStore();
      initAttachments();
      refreshNavItems();
      initNotes();
      initEditorStore();

      (async function () {
        await updateLastSynced();
        if (await initUser()) {
          showUpgradeReminderDialogs();
        }
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());

        await showOnboardingDialog(interruptedOnboarding());
        await showFeatureDialog("highlights");
        await scheduleBackups();
      })();

      return () => {
        userCheckStatusEvent.unsubscribe();
      };
    },
    [
      initEditorStore,
      initStore,
      initAttachments,
      updateLastSynced,
      refreshNavItems,
      initUser,
      initNotes,
      addReminder,
      setIsVaultCreated
    ]
  );

  useEffect(() => {
    const systemTimeInvalidEvent = EV.subscribe(
      EVENTS.systemTimeInvalid,
      async ({ serverTime, localTime }) => {
        await showInvalidSystemTimeDialog({ serverTime, localTime });
      }
    );

    const attachmentsLoadingEvent = EV.subscribe(
      EVENTS.attachmentsLoading,
      ({ type, total, current }) => {
        const [key, status] = getProcessingStatusFromType(type);

        if (current === total) {
          removeStatus(key);
        } else {
          updateStatus({
            key,
            status: `${status} attachments (${current}/${total})`,
            progress: 0
          });
        }
      }
    );

    const progressEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ type, total, loaded }) => {
        const [key, status] = getProcessingStatusFromType(type);
        if (!key) return;

        const percent = Math.round((loaded / total) * 100);
        const text = getStatus(key)?.status || `${status} attachment`;

        if (loaded === total) {
          removeStatus(key);
        } else {
          updateStatus({
            key,
            status: text,
            progress: loaded === total ? 100 : percent
          });
        }
      }
    );

    registerKeyMap();
    return () => {
      attachmentsLoadingEvent.unsubscribe();
      progressEvent.unsubscribe();
      systemTimeInvalidEvent.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setShow(!isFocusMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    introduceFeatures();
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    if (!dialogAnnouncements.length || isTesting()) return;
    (async () => {
      await showAnnouncementDialog(dialogAnnouncements[0]);
    })();
  }, [dialogAnnouncements]);

  useEffect(() => {
    if (!followSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [isSystemThemeDark, followSystemTheme, setTheme]);

  useEffect(() => {
    const { unsubscribe } =
      desktop?.bridge.onCreateItem.subscribe(undefined, {
        onData(itemType) {
          switch (itemType) {
            case "note":
              hashNavigate("/notes/create", { addNonce: true, replace: true });
              break;
            case "notebook":
              hashNavigate("/notebooks/create", { replace: true });
              break;
            case "reminder":
              hashNavigate("/reminders/create", { replace: true });
              break;
          }
        }
      }) || {};

    return () => {
      unsubscribe?.();
    };
  }, []);

  return <React.Fragment />;
}

function getProcessingStatusFromType(type) {
  switch (type) {
    case "download":
      return ["downloadingAttachments", "Downloading"];
    case "upload":
      return ["uploadingAttachments", "Uploading"];
    case "encrypt":
      return ["encryptingAttachments", "Encrypting"];
    default:
      return undefined;
  }
}
