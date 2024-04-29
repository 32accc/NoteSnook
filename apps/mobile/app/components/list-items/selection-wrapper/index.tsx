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
import React, { PropsWithChildren, useRef } from "react";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { Pressable } from "../../ui/pressable";
import { Filler } from "./back-fill";
import { SelectionIcon } from "./selection";
import { Item, TrashItem } from "@notesnook/core";

export function selectItem(item: Item) {
  if (useSelectionStore.getState().selectionMode === item.type) {
    const { selectionMode, clearSelection, setSelectedItem } =
      useSelectionStore.getState();

    if (selectionMode === item.type) {
      setSelectedItem(item.id);
    }

    if (useSelectionStore.getState().selectedItemsList.length === 0) {
      clearSelection();
    }
    return true;
  }
  return false;
}

type SelectionWrapperProps = PropsWithChildren<{
  item: Item;
  onPress: () => void;
  testID?: string;
  isSheet?: boolean;
  color?: string;
}>;

const SelectionWrapper = ({
  item,
  onPress,
  testID,
  isSheet,
  children,
  color
}: SelectionWrapperProps) => {
  const itemId = useRef(item.id);
  const { colors, isDark } = useThemeColors();
  const compactMode = useIsCompactModeEnabled(
    (item as TrashItem).itemType || item.type
  );

  if (item.id !== itemId.current) {
    itemId.current = item.id;
  }

  const onLongPress = () => {
    if (useSelectionStore.getState().selectionMode !== item.type) {
      useSelectionStore.getState().setSelectionMode(item.type);
    }
    useSelectionStore.getState().setSelectedItem(item.id);
  };

  return (
    <Pressable
      customColor={isSheet ? colors.primary.hover : "transparent"}
      testID={testID}
      onLongPress={onLongPress}
      onPress={onPress}
      customSelectedColor={colors.primary.hover}
      customAlpha={!isDark ? -0.02 : 0.02}
      customOpacity={1}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        overflow: "hidden",
        paddingHorizontal: 12,
        paddingVertical: compactMode ? 4 : 12,
        borderRadius: isSheet ? 10 : 0,
        marginBottom: isSheet ? 12 : undefined
      }}
    >
      {item.type === "note" ? <Filler item={item} color={color} /> : null}
      <SelectionIcon item={item} />
      {children}
    </Pressable>
  );
};

export default SelectionWrapper;
