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
import { useMessageStore } from "../../../stores/use-message-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { Announcement } from "../../announcements/announcement";
import { Card } from "../../list/card";

export type ListHeaderProps = {
  noAnnouncement?: boolean;
  color?: string;
  messageCard?: boolean;
  screen?: string;
  shouldShow?: boolean;
};

export const Header = React.memo(
  ({
    messageCard = true,
    color,
    shouldShow = false,
    noAnnouncement,
    screen
  }: ListHeaderProps) => {
    const { colors } = useThemeColors();
    const announcements = useMessageStore((state) => state.announcements);
    const selectionMode = useSelectionStore((state) => state.selectionMode);

    return selectionMode ? null : (
      <>
        {announcements.length !== 0 && !noAnnouncement ? (
          <Announcement color={color || colors.primary.accent} />
        ) : (screen as any) === "Search" ? null : !shouldShow ? (
          <View
            style={{
              marginBottom: 5,
              padding: 0,
              width: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {messageCard ? (
              <Card color={color || colors.primary.accent} />
            ) : null}
          </View>
        ) : null}
      </>
    );
  }
);

Header.displayName = "Header";
