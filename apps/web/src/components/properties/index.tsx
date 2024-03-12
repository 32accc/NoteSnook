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

import React, { PropsWithChildren } from "react";
import {
  Pin,
  StarOutline,
  Unlock,
  Readonly,
  SyncOff,
  ArrowLeft,
  Circle,
  Checkmark
} from "../icons";
import { Flex, Text } from "@theme-ui/components";
import {
  useEditorStore,
  ReadonlyEditorSession,
  DefaultEditorSession
} from "../../stores/editor-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { store as noteStore } from "../../stores/note-store";
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import ScrollContainer from "../scroll-container";
import { ResolvedItem, getFormattedDate, usePromise } from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { ListItemWrapper } from "../list-container/list-profiles";
import { VirtualizedList } from "../virtualized-list";
import { SessionItem } from "../session-item";
import { VirtualizedTable } from "../virtualized-table";

const tools = [
  { key: "pin", property: "pinned", icon: Pin, label: "Pin" },
  {
    key: "favorite",
    property: "favorite",
    icon: StarOutline,
    label: "Favorite"
  },
  { key: "lock", icon: Unlock, label: "Lock", property: "locked" },
  {
    key: "readonly",
    icon: Readonly,
    label: "Readonly",
    property: "readonly"
  },
  {
    key: "local-only",
    icon: SyncOff,
    label: "Disable sync",
    property: "localOnly"
  }
] as const;

type MetadataItem<T extends "dateCreated" | "dateEdited"> = {
  key: T;
  label: string;
  value: (value: number) => string;
};

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => getFormattedDate(date || Date.now())
  } as MetadataItem<"dateCreated">,
  {
    key: "dateEdited",
    label: "Last edited at",
    value: (date) => (date ? getFormattedDate(date) : "never")
  } as MetadataItem<"dateEdited">
];

type EditorPropertiesProps = {
  id: string;
};
function EditorProperties(props: EditorPropertiesProps) {
  const { id } = props;

  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useEditorStore((store) =>
    store.getSession(id, ["default", "unlocked", "readonly"])
  );

  if (isFocusMode || !session) return null;
  return (
    <AnimatedFlex
      animate={{
        x: 0
      }}
      transition={{
        duration: 0.1,
        bounceDamping: 1,
        bounceStiffness: 1,
        ease: "easeOut"
      }}
      initial={{ x: 600 }}
      sx={{
        display: "flex",
        position: "absolute",
        right: 0,
        zIndex: 1,
        height: "100%",
        width: "300px",
        borderLeft: "1px solid",
        borderLeftColor: "border"
      }}
    >
      <ScopedThemeProvider
        scope="editorSidebar"
        sx={{
          flex: 1,
          display: "flex",
          bg: "background",
          overflowY: "hidden",
          overflowX: "hidden",
          flexDirection: "column"
        }}
      >
        <ScrollContainer>
          <Section
            title="Properties"
            button={
              <ArrowLeft
                data-test-id="properties-close"
                onClick={() => toggleProperties(false)}
                size={18}
                sx={{ mr: 1, cursor: "pointer" }}
              />
            }
          >
            <>
              {tools.map((tool) => (
                <Toggle
                  {...tool}
                  key={tool.key}
                  isOn={!!session.note[tool.property]}
                  onToggle={() => changeToggleState(tool.key, session)}
                  testId={`properties-${tool.key}`}
                />
              ))}
            </>

            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                py={2}
                px={2}
                sx={{
                  borderBottom: "1px solid var(--separator)",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Text variant="subBody" sx={{ fontSize: "body" }}>
                  {item.label}
                </Text>
                <Text
                  className="selectable"
                  variant="subBody"
                  sx={{ fontSize: "body" }}
                >
                  {item.value(session.note[item.key])}
                </Text>
              </Flex>
            ))}
            <Colors noteId={id} color={session.color} />
          </Section>
          <Notebooks noteId={id} />
          <Reminders noteId={id} />
          <Attachments noteId={id} />
          <SessionHistory noteId={id} />
        </ScrollContainer>
      </ScopedThemeProvider>
    </AnimatedFlex>
  );
}
export default React.memo(EditorProperties);

function Colors({ noteId, color }: { noteId: string; color?: string }) {
  const result = usePromise(() => db.colors.all.items(), [color]);
  return (
    <Flex
      py={2}
      px={2}
      sx={{
        cursor: "pointer",
        justifyContent: "start"
      }}
    >
      {result.status === "fulfilled" &&
        result.value.map((c) => {
          const isChecked = c.id === color;
          return (
            <Flex
              key={c.id}
              onClick={() => noteStore.get().setColor(c.id, isChecked, noteId)}
              sx={{
                cursor: "pointer",
                position: "relative",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              data-test-id={`properties-${c.title}`}
            >
              <Circle
                size={35}
                color={c.colorCode}
                data-test-id={`toggle-state-${isChecked ? "on" : "off"}`}
              />
              {isChecked && (
                <Checkmark
                  color="white"
                  size={18}
                  sx={{ position: "absolute", left: "8px" }}
                />
              )}
            </Flex>
          );
        })}
    </Flex>
  );
}

function Notebooks({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.relations
      .to({ id: noteId, type: "note" }, "notebook")
      .selector.sorted(db.settings.getGroupOptions("notebooks"))
  );

  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Notebooks">
      <VirtualizedList
        mode="fixed"
        estimatedSize={50}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="notebook">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} simplified />
            )}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}
function Reminders({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.relations
      .from({ id: noteId, type: "note" }, "reminder")
      .selector.sorted(db.settings.getGroupOptions("reminders"))
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Reminders">
      <VirtualizedList
        mode="fixed"
        estimatedSize={54}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="reminder">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} simplified />
            )}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}
function Attachments({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.attachments
      .ofNote(noteId, "all")
      .sorted({ sortBy: "dateCreated", sortDirection: "desc" })
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Attachments">
      <VirtualizedTable
        estimatedSize={30}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        header={<></>}
        headerSize={0}
        renderRow={({ index }) => (
          <ResolvedItem index={index} type="attachment" items={result.value}>
            {({ item }) => <ListItemWrapper item={item} compact />}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}
function SessionHistory({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.noteHistory
      .get(noteId)
      .sorted({ sortBy: "dateModified", sortDirection: "desc" })
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title="Previous Sessions"
      subtitle={"Your session history is local only."}
    >
      <VirtualizedList
        mode="fixed"
        estimatedSize={28}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem type="session" index={index} items={result.value}>
            {({ item }) => <SessionItem noteId={noteId} session={item} />}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}

type SectionProps = { title: string; subtitle?: string; button?: JSX.Element };
export function Section({
  title,
  subtitle,
  button,
  children
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        borderRadius: "default",
        flexDirection: "column"
      }}
    >
      <Flex mx={2} mt={2} sx={{ alignItems: "center" }}>
        {button}
        <Text variant="subtitle">{title}</Text>
      </Flex>
      {subtitle && (
        <Text variant="subBody" mb={1} mx={2}>
          {subtitle}
        </Text>
      )}
      {children}
    </Flex>
  );
}

function changeToggleState(
  prop: "lock" | "readonly" | "local-only" | "pin" | "favorite",
  session: ReadonlyEditorSession | DefaultEditorSession
) {
  const {
    id: sessionId,
    locked,
    readonly,
    localOnly,
    pinned,
    favorite
  } = session.note;
  if (!sessionId) return;
  switch (prop) {
    case "lock":
      return locked ? noteStore.unlock(sessionId) : noteStore.lock(sessionId);
    case "readonly":
      return noteStore.readonly(!readonly, sessionId);
    case "local-only":
      return noteStore.localOnly(!localOnly, sessionId);
    case "pin":
      return noteStore.pin(!pinned, sessionId);
    case "favorite":
      return noteStore.favorite(!favorite, sessionId);
    default:
      return;
  }
}
