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

import { getTotalNotes } from "@notesnook/common";
import { useThemeColors } from "@notesnook/theme";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useRef } from "react";
import { RefreshControl, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { notesnook } from "../../../e2e/test.ids";
import { useGroupOptions } from "../../hooks/use-group-options";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { useSettingStore } from "../../stores/use-setting-store";
import { eScrollEvent } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";
import JumpToSectionDialog from "../dialogs/jump-to-section";
import { Footer } from "../list-items/footer";
import { Header } from "../list-items/headers/header";
import { SectionHeader } from "../list-items/headers/section-header";
import { NoteWrapper } from "../list-items/note/wrapper";
import { NotebookWrapper } from "../list-items/notebook/wrapper";
import ReminderItem from "../list-items/reminder";
import TagItem from "../list-items/tag";
import { Empty } from "./empty";

const renderItems = {
  note: NoteWrapper,
  notebook: NotebookWrapper,
  topic: NotebookWrapper,
  tag: TagItem,
  section: SectionHeader,
  header: SectionHeader,
  reminder: ReminderItem
};

const RenderItem = ({ item, index, type, ...restArgs }) => {
  if (!item) return <View />;
  const Item = renderItems[item.itemType || item.type] || View;
  const totalNotes = getTotalNotes(item);
  return (
    <Item
      item={item}
      index={index}
      type={type}
      totalNotes={totalNotes}
      {...restArgs}
    />
  );
};

/**
 *
 * @param {any} param0
 * @returns
 */
const List = ({
  listData,
  type,
  refreshCallback,
  placeholderData,
  loading,
  headerProps = {
    heading: "Home",
    color: null
  },
  screen,
  ListHeader,
  warning,
  isSheet = false,
  onMomentumScrollEnd,
  handlers,
  ScrollComponent
}) => {
  const { colors } = useThemeColors();
  const scrollRef = useRef();
  const [notesListMode, notebooksListMode] = useSettingStore((state) => [
    state.settings.notesListMode,
    state.settings.notebooksListMode
  ]);
  const isCompactModeEnabled =
    (type === "notes" && notesListMode === "compact") ||
    type === "notebooks" ||
    notebooksListMode === "compact";
  const groupType =
    screen === "Home" ? "home" : screen === "Favorites" ? "favorites" : type;

  const groupOptions = useGroupOptions(groupType);

  const dateBy =
    groupOptions.sortBy !== "title" ? groupOptions.sortBy : "dateEdited";

  const renderItem = React.useCallback(
    ({ item, index }) => (
      <RenderItem
        item={item}
        index={index}
        color={headerProps?.color}
        title={headerProps?.heading}
        dateBy={dateBy}
        type={groupType}
        screen={screen}
        isSheet={isSheet}
        groupOptions={groupOptions}
      />
    ),
    [
      headerProps?.color,
      headerProps?.heading,
      screen,
      isSheet,
      dateBy,
      groupType,
      groupOptions
    ]
  );

  const _onRefresh = async () => {
    Sync.run("global", false, true, () => {
      if (refreshCallback) {
        refreshCallback();
      }
    });
  };

  const _onScroll = React.useCallback(
    (event) => {
      if (!event) return;
      let y = event.nativeEvent.contentOffset.y;
      eSendEvent(eScrollEvent, {
        y,
        screen
      });
    },
    [screen]
  );

  useEffect(() => {
    eSendEvent(eScrollEvent, {
      y: 0,
      screen
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let styles = {
    width: "100%",
    minHeight: 1,
    minWidth: 1
  };

  const ListView = ScrollComponent ? ScrollComponent : FlashList;
  return (
    <>
      <Animated.View
        style={{
          flex: 1
        }}
        entering={type === "search" ? undefined : FadeInDown}
      >
        <ListView
          {...handlers}
          style={styles}
          ref={scrollRef}
          testID={notesnook.list.id}
          data={listData}
          renderItem={renderItem}
          onScroll={_onScroll}
          nestedScrollEnabled={true}
          onMomentumScrollEnd={() => {
            tabBarRef.current?.unlock();
            onMomentumScrollEnd?.();
          }}
          getItemType={(item) => item.itemType || item.type}
          estimatedItemSize={isCompactModeEnabled ? 60 : 100}
          directionalLockEnabled={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          refreshControl={
            <RefreshControl
              tintColor={colors.primary.accent}
              colors={[colors.primary.accent]}
              progressBackgroundColor={colors.secondary.background}
              onRefresh={_onRefresh}
              refreshing={false}
            />
          }
          ListEmptyComponent={
            placeholderData ? (
              <Empty
                loading={loading}
                placeholderData={placeholderData}
                headerProps={headerProps}
                type={type}
                screen={screen}
              />
            ) : null
          }
          ListFooterComponent={<Footer />}
          ListHeaderComponent={
            <>
              {ListHeader ? (
                ListHeader
              ) : !headerProps ? null : (
                <Header
                  title={headerProps.heading}
                  color={headerProps.color}
                  type={type}
                  screen={screen}
                  warning={warning}
                />
              )}
            </>
          }
        />
      </Animated.View>
      {listData ? (
        <JumpToSectionDialog
          screen={screen}
          data={listData}
          type={screen === "Home" ? "home" : type}
          scrollRef={scrollRef}
        />
      ) : null}
    </>
  );
};

export default List;