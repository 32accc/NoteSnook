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

import Vault from "../common/vault";
import {
  showAddReminderDialog,
  showBuyDialog,
  showCreateTagDialog,
  showEditReminderDialog,
  showEditTagDialog,
  showEmailVerificationDialog,
  showFeatureDialog,
  showOnboardingDialog
} from "../common/dialog-controller";
import {
  showAddNotebookDialog,
  showEditNotebookDialog
} from "../common/dialog-controller";
import { closeOpenedDialog } from "../common/dialog-controller";
import RouteContainer from "../components/route-container";
import DiffViewer from "../components/diff-viewer";
import Unlock from "../components/unlock";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { isMobile } from "../utils/dimensions";
import {
  showEditTopicDialog,
  showCreateTopicDialog
} from "../common/dialog-controller";
import { hashNavigate } from ".";
import EditorPlaceholder from "../components/editor/-placeholder";
import Editor from "../components/editor";

const hashroutes = {
  "/": () => {
    return !editorStore.get().session.state && <EditorPlaceholder />;
  },
  "/email/verify": () => {
    showEmailVerificationDialog();
  },
  "/notebooks/create": () => {
    showAddNotebookDialog();
  },
  "/notebooks/:notebookId/edit": ({ notebookId }) => {
    showEditNotebookDialog(notebookId);
  },
  "/topics/create": () => {
    showCreateTopicDialog();
  },
  "/reminders/create": () => {
    showAddReminderDialog();
  },
  "/reminders/:reminderId/edit": ({ reminderId }) => {
    showEditReminderDialog(reminderId);
  },
  "/notebooks/:notebookId/topics/:topicId/edit": ({ notebookId, topicId }) => {
    showEditTopicDialog(notebookId, topicId);
  },
  "/tags/create": () => {
    showCreateTagDialog();
  },
  "/tags/:tagId/edit": ({ tagId }) => {
    showEditTagDialog(tagId);
  },
  "/notes/create": () => {
    closeOpenedDialog();
    hashNavigate("/notes/create", { addNonce: true, replace: true });
  },
  "/notes/create/:nonce": ({ nonce }) => {
    closeOpenedDialog();
    return <Editor noteId={0} nonce={nonce} />;
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    closeOpenedDialog();

    return <Editor noteId={noteId} />;
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
    closeOpenedDialog();
    return (
      <RouteContainer
        buttons={{
          back: isMobile()
            ? {
                title: "Go back",
                action: () =>
                  hashNavigate("/notes/create", {
                    addNonce: true,
                    replace: true
                  })
              }
            : undefined
        }}
        component={<Unlock noteId={noteId} />}
      />
    );
  },
  "/notes/:noteId/conflict": ({ noteId }) => {
    closeOpenedDialog();
    return <DiffViewer noteId={noteId} />;
  },
  "/vault/changePassword": () => {
    Vault.changeVaultPassword();
  },
  "/vault/create": () => {
    Vault.createVault().then((res) => {
      appStore.setIsVaultCreated(res);
    });
  },
  "/buy": () => {
    showBuyDialog();
  },
  "/buy/:code": ({ code }) => {
    showBuyDialog("monthly", code);
  },
  "/buy/:plan/:code": ({ plan, code }) => {
    showBuyDialog(plan, code);
  },
  "/welcome": () => {
    showOnboardingDialog("new");
  },
  "/confirmed": () => {
    showFeatureDialog("confirmed");
  }
};

export default hashroutes;
