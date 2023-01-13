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
import React from "react";
import { View, ViewStyle } from "react-native";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import Paragraph from "../typography/paragraph";

export default function Tag({
  text,
  textColor,
  background,
  visible,
  style
}: {
  text: string;
  background?: string;
  textColor?: string;
  visible?: boolean;
  style?: ViewStyle;
}) {
  const colors = useThemeStore((state) => state.colors);
  return !visible ? null : (
    <View
      style={{
        backgroundColor: background || colors.accent,
        borderRadius: 100,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 2,
        marginTop: -10,
        height: 20,
        ...style
      }}
    >
      <Paragraph color={textColor || colors.light} size={SIZE.xxs}>
        {text}
      </Paragraph>
    </View>
  );
}
