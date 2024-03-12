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
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDBItem } from "../../../hooks/use-db-item";
import { useTabStore } from "../../../screens/editor/tiptap/use-tab-store";
import { editorController } from "../../../screens/editor/tiptap/utils";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import { eUnlockNote } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

type TabItem = {
  id: number;
  noteId?: string;
  previewTab?: boolean;
  locked?: boolean;
};

const TabItemComponent = (props: {
  tab: TabItem;
  isFocused: boolean;
  close?: (ctx?: string | undefined) => void;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(props.tab.noteId, "note");

  return (
    <Pressable
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingLeft: 12,
        height: 45
      }}
      type={props.isFocused ? "selected" : "transparent"}
      onPress={() => {
        if (!props.isFocused) {
          useTabStore.getState().focusTab(props.tab.id);
          props.close?.();
          if (props.tab.locked) {
            eSendEvent(eUnlockNote);
          }

          if (!props.tab.noteId) {
            setTimeout(() => {
              editorController?.current?.commands?.focus(props.tab.id);
            }, 300);
          }
        }
      }}
      onLongPress={() => {
        useTabStore.getState().updateTab(props.tab.id, {
          previewTab: false
        });
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 10
        }}
      >
        {props.tab.locked ? <Icon size={SIZE.md} name="lock" /> : null}
        <Paragraph
          color={
            props.isFocused
              ? colors.selected.paragraph
              : colors.primary.paragraph
          }
          style={{
            fontStyle: props.tab.previewTab ? "italic" : "normal"
          }}
          size={SIZE.md}
        >
          {props.tab.noteId ? item?.title || "Untitled note" : "New note"}
        </Paragraph>
      </View>

      <IconButton
        name="close"
        size={SIZE.lg}
        color={colors.primary.icon}
        onPress={() => {
          const isLastTab = useTabStore.getState().tabs.length === 1;
          useTabStore.getState().removeTab(props.tab.id);
          // The last tab is not actually removed, it is just cleaned up.
          if (isLastTab) {
            editorController.current?.reset(props.tab.id, true, true);
            props.close?.();
          }
        }}
        top={0}
        left={0}
        right={20}
        bottom={0}
      />
    </Pressable>
  );
};

export default function EditorTabs({
  close
}: {
  close?: (ctx?: string | undefined) => void;
}) {
  const [tabs, currentTab] = useTabStore((state) => [
    state.tabs,
    state.currentTab
  ]);

  const renderTabItem = React.useCallback(
    ({ item }: { item: TabItem }) => {
      return (
        <TabItemComponent
          key={item.id}
          tab={item}
          isFocused={item.id === currentTab}
          close={close}
        />
      );
    },
    [close, currentTab]
  );

  return (
    <View
      style={{
        paddingHorizontal: 12,
        gap: 12,
        maxHeight: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center"
        }}
      >
        <Heading size={SIZE.lg}>Tabs</Heading>
        <Button
          onPress={() => {
            useTabStore.getState().newTab();
            setTimeout(() => {
              editorController?.current?.commands?.focus(
                useTabStore.getState().currentTab
              );
            }, 500);
            close?.();
          }}
          title="New tab"
          icon="plus"
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            borderRadius: 100,
            height: 35
          }}
          iconSize={SIZE.lg}
        />
      </View>

      <FlatList windowSize={3} data={tabs} renderItem={renderTabItem} />
    </View>
  );
}

EditorTabs.present = () => {
  presentSheet({
    component: (ref, close, update) => <EditorTabs close={close} />
  });
};
