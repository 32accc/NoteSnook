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

import { Dialogs } from "../dialogs";
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { useEditorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Config from "../utils/config";
import { AppVersion, getChangelog } from "../utils/version";
import { Period } from "../dialogs/buy-dialog/types";
import { FeatureKeys } from "../dialogs/feature-dialog";
import { Suspense } from "react";
import { ConfirmDialogProps } from "../dialogs/confirm";
import { getFormattedDate } from "@notesnook/common";
import { downloadUpdate } from "../utils/updater";
import { ThemeMetadata } from "@notesnook/themes-server";
import {
  Color,
  Profile,
  Reminder,
  Tag,
  AuthenticatorType
} from "@notesnook/core";
import { createRoot } from "react-dom/client";
import { PasswordDialogProps } from "../dialogs/password-dialog";
import { LinkAttributes } from "@notesnook/editor/dist/extensions/link";

type DialogTypes = typeof Dialogs;
type DialogIds = keyof DialogTypes;
export type Perform<T = boolean> = (result: T) => void;
type RenderDialog<TId extends DialogIds, TReturnType> = (
  dialog: DialogTypes[TId],
  perform: (result: TReturnType) => void
) => JSX.Element;

let openDialogs: Partial<Record<DialogIds, boolean>> = {};
function showDialog<TId extends DialogIds, TReturnType>(
  id: TId,
  render: RenderDialog<TId, TReturnType>
): Promise<TReturnType> {
  return new Promise((resolve) => {
    if (openDialogs[id]) return false;

    const container = document.createElement("div");
    container.id = id;
    const root = createRoot(container);

    const perform = (result: TReturnType) => {
      openDialogs[id] = false;
      root.unmount();
      container.remove();
      resolve(result);
    };
    const PropDialog = () => render(Dialogs[id], perform);
    root.render(
      <Suspense fallback={<div />}>
        <PropDialog />
      </Suspense>
    );
    openDialogs[id] = true;
  });
}

export function closeOpenedDialog() {
  openDialogs = {};
  const dialogs = document.querySelectorAll(
    ".ReactModalPortal,[data-react-modal-body-trap]"
  );
  dialogs.forEach((elem) => elem.remove());
}

export function showAddTagsDialog(noteIds: string[]) {
  return showDialog("AddTagsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: any) => perform(res)} noteIds={noteIds} />
  ));
}

export function showCreateColorDialog() {
  return showDialog<"CreateColorDialog", string | undefined>(
    "CreateColorDialog",
    (Dialog, perform) => (
      <Dialog onClose={() => perform(undefined)} onDone={(id) => perform(id)} />
    )
  );
}

export function showAddNotebookDialog(parentId?: string) {
  return showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      parentId={parentId}
      onClose={() => {
        perform(false);
      }}
    />
  ));
}

export function showNoteLinkingDialog(attr?: LinkAttributes) {
  return showDialog<"NoteLinkingDialog", LinkAttributes | undefined>(
    "NoteLinkingDialog",
    (Dialog, perform) => (
      <Dialog
        attributes={attr}
        onDone={(link) => perform(link)}
        onClose={() => perform(undefined)}
      />
    )
  );
}

export async function showEditNotebookDialog(notebookId: string) {
  const notebook = await db.notebooks.notebook(notebookId);
  if (!notebook) return;
  return await showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      notebook={notebook}
      edit={true}
      onClose={() => {
        perform(false);
      }}
    />
  ));
}

export function showBuyDialog(plan?: Period, couponCode?: string) {
  return showDialog("BuyDialog", (Dialog, perform) => (
    <Dialog
      plan={plan}
      couponCode={couponCode}
      onClose={() => perform(false)}
    />
  ));
}

export function confirm<TCheckId extends string>(
  props: Omit<ConfirmDialogProps<TCheckId>, "onClose">
) {
  return showDialog<"Confirm", false | Record<TCheckId, boolean>>(
    "Confirm",
    (Dialog, perform) => (
      <Dialog {...props} onClose={(result) => perform(result)} />
    )
  );
}

export function showPromptDialog(props: {
  title: string;
  description?: string;
  defaultValue?: string;
}) {
  return showDialog<"Prompt", string | null>("Prompt", (Dialog, perform) => (
    <Dialog
      {...props}
      onClose={() => perform(null)}
      onSave={(text) => {
        perform(text);
      }}
    />
  ));
}

export function showEmailChangeDialog() {
  return showDialog("EmailChangeDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(null)} />
  ));
}

export function showError(title: string, message: string) {
  return confirm({ title, message, positiveButtonText: "Okay" });
}

export function showMultiDeleteConfirmation(length: number) {
  return confirm({
    title: `Delete ${length} items?`,
    message: `These items will be **kept in your Trash for ${
      db.settings.getTrashCleanupInterval() || 7
    } days** after which they will be permanently deleted.`,
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showMultiPermanentDeleteConfirmation(length: number) {
  return confirm({
    title: `Permanently delete ${length} items?`,
    message:
      "These items will be **permanently deleted**. This is IRREVERSIBLE.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showLogoutConfirmation() {
  return confirm({
    title: `Logout?`,
    message:
      "Logging out will clear all data stored on THIS DEVICE. Make sure you have synced all your changes before logging out.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showClearSessionsConfirmation() {
  return confirm({
    title: `Logout from other devices?`,
    message:
      "All other logged-in devices will be forced to logout stopping sync. Use with care lest you lose important notes.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showAccountLoggedOutNotice(reason?: string) {
  return confirm({
    title: "You were logged out",
    message: reason,
    negativeButtonText: "Okay"
  });
}

export function showAppUpdatedNotice(
  version: AppVersion & { changelog?: string }
) {
  return confirm({
    title: `Welcome to v${version.formatted}`,
    message: `## Changelog:
    
\`\`\`
${version.changelog || "No change log."}
\`\`\`
`,
    positiveButtonText: `Continue`
  });
}

export function showEmailVerificationDialog() {
  return showDialog("EmailVerificationDialog", (Dialog, perform) => (
    <Dialog onCancel={() => perform(false)} />
  ));
}

export function showMigrationDialog() {
  return showDialog("MigrationDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(false)} />
  ));
}

type LoadingDialogProps<T> = {
  title: string;
  message?: string;
  subtitle: string;
  action: () => T | Promise<T>;
};
export function showLoadingDialog<T>(dialogData: LoadingDialogProps<T>) {
  const { title, message, subtitle, action } = dialogData;
  return showDialog<"LoadingDialog", T | boolean>(
    "LoadingDialog",
    (Dialog, perform) => (
      <Dialog
        title={title}
        description={subtitle}
        message={message}
        action={action}
        onClose={(e) => perform(e as T | boolean)}
      />
    )
  );
}

type ProgressDialogProps = {
  title: string;
  subtitle: string;
  action: (...args: never[]) => void;
};
export function showProgressDialog<T>(dialogData: ProgressDialogProps) {
  const { title, subtitle, action } = dialogData;
  return showDialog<"ProgressDialog", T>(
    "ProgressDialog",
    (Dialog, perform) => (
      <Dialog
        title={title}
        subtitle={subtitle}
        action={action}
        onDone={(e: T) => perform(e)}
      />
    )
  );
}

export function showThemeDetails(theme: ThemeMetadata) {
  return showDialog("ThemeDetailsDialog", (Dialog, perform) => (
    <Dialog theme={theme} onClose={(res: boolean) => perform(res)} />
  ));
}

export function showMoveNoteDialog(noteIds: string[]) {
  return showDialog("MoveDialog", (Dialog, perform) => (
    <Dialog noteIds={noteIds} onClose={(res: boolean) => perform(res)} />
  ));
}

export function showPasswordDialog<
  TInputId extends string,
  TCheckId extends string
>(props: Omit<PasswordDialogProps<TInputId, TCheckId>, "onClose">) {
  return showDialog<
    "PasswordDialog",
    string extends TCheckId ? boolean : false | Record<TCheckId, boolean>
  >("PasswordDialog", (Dialog, perform) => (
    <Dialog
      {...props}
      onClose={(result) =>
        perform(
          result as string extends TCheckId
            ? boolean
            : false | Record<TCheckId, boolean>
        )
      }
    />
  ));
}

export function showBackupPasswordDialog(
  validate: (outputs: {
    password?: string;
    key?: string;
  }) => boolean | Promise<boolean>
) {
  return showDialog("BackupPasswordDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(false)} validate={validate} />
  ));
}

export function showRecoveryKeyDialog() {
  return showDialog("RecoveryKeyDialog", (Dialog, perform) => (
    <Dialog onDone={() => perform(true)} />
  ));
}

export function showCreateTagDialog() {
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Create tag"}
      subtitle={"You can create as many tags as you want."}
      onClose={() => {
        perform(false);
      }}
      onAction={async (title: string) => {
        await db.tags.add({ title });
        showToast("success", "Tag created!");
        tagStore.refresh();
        perform(true);
      }}
    />
  ));
}

export function showEditTagDialog(tag: Tag) {
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Edit tag"}
      subtitle={`You are editing #${tag.title}.`}
      defaultValue={tag.title}
      onClose={() => perform(false)}
      onAction={async (title: string) => {
        await db.tags.add({ id: tag.id, title });
        showToast("success", "Tag edited!");
        await tagStore.refresh();
        await useEditorStore.getState().refreshTags();
        await noteStore.refresh();
        await appStore.refreshNavItems();
        perform(true);
      }}
    />
  ));
}

export function showRenameColorDialog(color: Color) {
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Rename color"}
      subtitle={`You are renaming color ${color.title}.`}
      defaultValue={color.title}
      onClose={() => perform(false)}
      onAction={async (title: string) => {
        if (!title) return;
        await db.colors.add({ id: color.id, title });
        showToast("success", "Color renamed!");
        appStore.refreshNavItems();
        perform(true);
      }}
    />
  ));
}

export function showFeatureDialog(featureName: FeatureKeys) {
  return showDialog("FeatureDialog", (Dialog, perform) => (
    <Dialog featureName={featureName} onClose={(res) => perform(res)} />
  ));
}

export function showReminderDialog(reminderKey: string) {
  if (Config.get(reminderKey, false)) return;

  return showDialog("ReminderDialog", (Dialog, perform) => (
    <Dialog
      reminderKey={reminderKey}
      onClose={(res: boolean) => {
        Config.set(reminderKey, true);
        perform(res);
      }}
    />
  ));
}

export function showReminderPreviewDialog(reminder: Reminder) {
  return showDialog("ReminderPreviewDialog", (Dialog, perform) => (
    <Dialog reminder={reminder} onClose={perform} />
  ));
}

export async function showAddReminderDialog(noteId?: string) {
  const note = noteId ? await db.notes.note(noteId) : undefined;
  return showDialog("AddReminderDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} note={note} />
  ));
}

export async function showEditReminderDialog(reminderId: string) {
  const reminder = await db.reminders.reminder(reminderId);
  if (!reminder) return null;
  return showDialog("AddReminderDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} reminder={reminder} />
  ));
}

export function showAnnouncementDialog(announcement: any) {
  return showDialog("AnnouncementDialog", (Dialog, perform) => (
    <Dialog
      announcement={announcement}
      onClose={(res: boolean) => perform(res)}
    />
  ));
}

export function showIssueDialog() {
  return showDialog("IssueDialog", (Dialog, perform) => (
    <Dialog
      onClose={(res: boolean) => {
        perform(res);
      }}
    />
  ));
}

export function showMultifactorDialog(primaryMethod?: AuthenticatorType) {
  return showDialog("MultifactorDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} primaryMethod={primaryMethod} />
  ));
}

export function show2FARecoveryCodesDialog(primaryMethod: AuthenticatorType) {
  return showDialog("RecoveryCodesDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} primaryMethod={primaryMethod} />
  ));
}

export function showAttachmentsDialog() {
  return showDialog("AttachmentsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
  ));
}

export function showEditProfilePictureDialog(profile?: Profile) {
  return showDialog("EditProfilePictureDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} profile={profile} />
  ));
}

export function showImagePickerDialog(images: File[]): Promise<false | File[]> {
  if (images.length <= 0) return Promise.resolve(false);

  return showDialog("ImagePickerDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} images={images} />
  ));
}

export function showSettings() {
  return showDialog("SettingsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
  ));
}

export function showOnboardingDialog(type?: string) {
  if (!type) return;
  return showDialog("OnboardingDialog", (Dialog, perform) => (
    <Dialog type={type} onClose={(res: boolean) => perform(res)} />
  ));
}

export async function showInvalidSystemTimeDialog({
  serverTime,
  localTime
}: {
  serverTime: number;
  localTime: number;
}) {
  const result = await confirm({
    title: "Your system clock is out of sync",
    subtitle:
      "Please correct your system date & time and reload the app to avoid syncing issues.",
    message: `Server time: ${getFormattedDate(serverTime)}
Local time: ${getFormattedDate(localTime)}
Please sync your system time with [https://time.is](https://time.is).`,
    positiveButtonText: "Reload app"
  });
  if (result) window.location.reload();
}

export async function showUpdateAvailableNotice({
  version
}: {
  version: string;
}) {
  const changelog = await getChangelog(version);

  return showUpdateDialog({
    title: `New version available`,
    subtitle: `v${version} is available for download`,
    changelog,
    action: { text: `Update now`, onClick: () => downloadUpdate() }
  });
}

type UpdateDialogProps = {
  title: string;
  subtitle: string;
  changelog: string;
  action: {
    text: string;
    onClick: () => void;
  };
};
async function showUpdateDialog({
  title,
  subtitle,
  changelog,
  action
}: UpdateDialogProps) {
  const result = await confirm({
    title,
    subtitle,
    message: changelog,
    width: 500,
    positiveButtonText: action.text
  });
  if (result && action.onClick) action.onClick();
}
