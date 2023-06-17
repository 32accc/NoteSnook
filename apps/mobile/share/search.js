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

import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../app/common/database";
import { getElevationStyle } from "../app/utils/elevation";
import { initDatabase, useShareStore } from "./store";

const ListItem = ({ item, mode, close }) => {
  const colors = useShareStore((state) => state.colors);
  const selectedNotebooks = useShareStore((state) => state.selectedNotebooks);
  const selectedTags = useShareStore((state) => state.selectedTags);
  const isSelected =
    mode === "appendNote"
      ? false
      : mode === "selectTags"
      ? selectedTags.indexOf(item.alias) > -1
      : selectedNotebooks.findIndex(
          (selected) => selected.id === item.id && selected.type === item.type
        ) > -1;

  const SearchSetters = React.useMemo(
    () => ({
      appendNote: (item) => {
        useShareStore.getState().setAppendNote(item);
        close();
      },
      selectNotebooks: (item) => {
        const selectedNotebooks = [
          ...useShareStore.getState().selectedNotebooks
        ];
        const currentIndex = selectedNotebooks.findIndex(
          (selected) => selected.id === item.id && selected.type === item.type
        );
        if (currentIndex === -1) {
          selectedNotebooks.push(item);
        } else {
          selectedNotebooks.splice(currentIndex, 1);
        }
        useShareStore.getState().setSelectedNotebooks(selectedNotebooks);
      },
      selectTags: (item) => {
        const selectedTags = [...useShareStore.getState().selectedTags];
        const currentIndex = selectedTags.indexOf(item.alias);
        if (currentIndex === -1) {
          selectedTags.push(item.alias);
        } else {
          selectedTags.splice(currentIndex, 1);
        }
        useShareStore.getState().setSelectedTags(selectedTags);
      }
    }),
    [close]
  );
  const set = React.useMemo(() => SearchSetters[mode], [mode, SearchSetters]);

  const onSelectItem = async (item) => {
    if (item.locked) {
      return;
    }
    set(item);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelectItem(item)}
      style={{
        flexDirection: "column",
        borderBottomWidth: item.topics?.length > 0 ? 0 : 1,
        borderBottomColor: colors.nav,
        justifyContent: "center",
        paddingVertical: 12
      }}
    >
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingLeft: item.type === "topic" ? 0 : 12
        }}
      >
        {item.type !== "note" ? (
          <Icon
            name={
              !isSelected
                ? "checkbox-blank-circle-outline"
                : "check-circle-outline"
            }
            style={{
              marginRight: 10
            }}
            size={20}
            color={isSelected ? colors.accent : colors.icon}
          />
        ) : null}

        <View
          style={{
            flexDirection: "column"
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: colors.pri,
              fontFamily:
                item.type === "topic"
                  ? "OpenSans-Regular"
                  : "OpenSans-SemiBold",
              fontSize: 15
            }}
          >
            {item.type === "tag" ? "#" : ""}
            {item.alias || item.title}
          </Text>
        </View>
      </View>

      {item.type === "notebook" && item.topics && item.topics.length > 0 ? (
        <View
          style={{
            paddingLeft: 40,
            marginTop: 5
          }}
        >
          {item.topics.map((topic) => (
            <ListItem key={topic.id} item={topic} mode={mode} close={close} />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const SearchGetters = {
  appendNote: () => db.notes.all,
  selectNotebooks: () => db.notebooks.all,
  selectTags: () => {
    const selected = useShareStore.getState().selectedTags;
    const tags = [];
    if (selected)
      tags.push(
        ...selected.map((t) => ({
          alias: t,
          type: "tag"
        }))
      );

    for (let tag of db.tags.all) {
      const index = tags.findIndex((t) => t.alias === tag.alias);
      // Skip selected tags as they are already in the list.
      if (index > -1) continue;
      tags.push(tag);
    }
    return tags;
  }
};

const SearchLookup = {
  appendNote: (items, kwd) => db.lookup.notes(items, kwd),
  selectNotebooks: (items, kwd) => db.lookup.notebooks(items, kwd),
  selectTags: (items, kwd) => db.lookup.tags(items, kwd)
};

export const Search = ({ close, getKeyboardHeight, quicknote, mode }) => {
  const colors = useShareStore((state) => state.colors);

  const { height } = useWindowDimensions();
  const timer = useRef(null);
  const inputRef = useRef();

  const [searchResults, setSearchResults] = useState([]);
  const searchableItems = useRef(null);
  const searchKeyword = useRef(null);

  const insets =
    Platform.OS === "android"
      ? { top: StatusBar.currentHeight }
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useSafeAreaInsets();

  const get = SearchGetters[mode];
  const lookup = SearchLookup[mode];

  const onSearch = async () => {
    if (!searchableItems.current) {
      await initDatabase();
      searchableItems.current = get();
    }
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    timer.current = setTimeout(async () => {
      if (!searchKeyword.current) {
        setSearchResults([]);
        setSearchResults(get());
        return;
      }
      setSearchResults(
        await lookup(searchableItems.current, searchKeyword.current)
      );
    }, 150);
  };

  useEffect(() => {
    (async () => {
      await initDatabase();
      searchableItems.current = get();
      setSearchResults(searchableItems.current);
    })();
  }, [get]);

  const renderItem = ({ item }) =>
    !item.locked ? <ListItem item={item} mode={mode} close={close} /> : null;

  let extra = quicknote
    ? {
        marginTop: -insets.top,
        paddingTop: insets.top
      }
    : {};
  const searchHeight = height - getKeyboardHeight();
  return (
    <View
      style={{
        position: "absolute",
        top: Platform.OS === "android" ? 20 : 0,
        backgroundColor: colors.bg,
        borderRadius: quicknote ? 0 : 10,
        width: quicknote ? "100%" : "95%",
        minHeight: 250,
        alignSelf: "center",
        overflow: "hidden",
        zIndex: 999,
        ...getElevationStyle(quicknote ? 1 : 5),
        ...extra
      }}
    >
      <View
        style={{
          flexShrink: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          marginBottom: 10,
          height: 50
        }}
      >
        <Icon
          name="arrow-left"
          color={colors.pri}
          style={{
            marginRight: 10
          }}
          size={25}
          onPress={close}
        />
        <TextInput
          ref={inputRef}
          placeholder="Search for a note"
          placeholderTextColor={colors.placeholder}
          style={{
            fontSize: 15,
            fontFamily: "OpenSans-Regular",
            flex: 1
          }}
          onChangeText={(value) => {
            if (mode === "selectTags") {
              searchKeyword.current = db.tags.sanitize(value);
            } else {
              searchKeyword.current = value;
            }
            onSearch();
          }}
          onSubmitEditing={onSearch}
        />

        <Icon name="magnify" color={colors.pri} size={25} onPress={onSearch} />
      </View>

      <View
        style={{
          maxHeight: searchHeight > 550 ? 550 : searchHeight,
          height: searchHeight > 550 ? 550 : searchHeight
        }}
      >
        <FlashList
          data={searchResults}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          renderItem={renderItem}
          estimatedItemSize={50}
          ListHeaderComponent={
            mode === "selectTags" &&
            (searchResults.length === 0 ||
              (searchKeyword.current &&
                searchKeyword.current.length > 0 &&
                !searchResults.find(
                  (item) => item.title === searchKeyword.current
                ))) ? (
              <ListItem
                item={{
                  type: "tag",
                  alias: searchKeyword.current
                }}
                mode={mode}
                close={close}
              />
            ) : null
          }
          ListFooterComponent={<View style={{ height: 200 }} />}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                height: 200
              }}
            >
              <Text
                style={{
                  fontFamily: "OpenSans-Regular",
                  color: colors.icon
                }}
              >
                {searchKeyword.current
                  ? `No results found for "${searchKeyword.current}"`
                  : "Search for a note to append to it."}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};
