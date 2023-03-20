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

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Flex, Text, Button } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import { useStore as useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import Field from "../field";
import { showToast } from "../../utils/toast";

function Unlock(props) {
  const { noteId } = props;

  const [isWrong, setIsWrong] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const passwordRef = useRef();

  const note = useMemo(
    () => !isLoading && db.notes.note(noteId)?.data,
    [noteId, isLoading]
  );
  const openLockedSession = useEditorStore((store) => store.openLockedSession);
  const openSession = useEditorStore((store) => store.openSession);
  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);

  const submit = useCallback(async () => {
    setIsUnlocking(true);
    const password = passwordRef.current.value;
    try {
      if (!password) return;
      const note = await db.vault.open(noteId, password);
      openLockedSession(note);
    } catch (e) {
      if (e.message.includes("ciphertext cannot be decrypted using that key")) {
        setIsWrong(true);
      } else {
        showToast("error", "Cannot unlock note: " + e);
        console.error(e);
      }
    } finally {
      setIsUnlocking(false);
    }
  }, [setIsWrong, noteId, openLockedSession]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      await openSession(noteId);
      setIsEditorOpen(true);

      setIsLoading(false);
    })();
  }, [openSession, setIsEditorOpen, noteId]);

  return (
    <Flex
      mx={2}
      sx={{
        flex: "1",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon.Lock size={100} sx={{ opacity: 0.2 }} />
        <Text
          data-test-id="unlock-note-title"
          variant="heading"
          mx={100}
          mt={25}
          sx={{ fontSize: 36, textAlign: "center" }}
        >
          {note?.title || "Open note"}
        </Text>
      </Flex>
      <Text
        variant="subheading"
        mt={1}
        mb={4}
        sx={{ textAlign: "center", color: "fontTertiary" }}
      >
        Please enter the password to unlock this note
      </Text>
      <Field
        id="vaultPassword"
        data-test-id="unlock-note-password"
        inputRef={passwordRef}
        autoFocus
        sx={{ width: ["95%", "95%", "30%"] }}
        placeholder="Enter password"
        type="password"
        onKeyUp={async (e) => {
          if (e.key === "Enter") {
            await submit();
          } else if (isWrong) {
            setIsWrong(false);
          }
        }}
      />
      {isWrong && (
        <Flex
          mt={2}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            color: "error",
            alignSelf: "flex-center"
          }}
        >
          <Icon.Alert color="error" size={12} />
          <Text ml={1} sx={{ fontSize: "body" }}>
            Wrong password
          </Text>
        </Flex>
      )}
      <Button
        mt={3}
        variant="primary"
        data-test-id="unlock-note-submit"
        disabled={isUnlocking}
        sx={{ borderRadius: 100, px: 30 }}
        onClick={async () => {
          await submit();
        }}
      >
        {isUnlocking ? "Unlocking..." : "Open note"}
      </Button>
    </Flex>
  );
}
export default Unlock;
