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

import React from "react";
import {
  ActivityIndicator,
  ColorValue,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ColorKey, useThemeStore } from "../../../stores/use-theme-store";
import { useUserStore } from "../../../stores/use-user-store";
import { BUTTON_TYPES } from "../../../utils/constants";
import { SIZE } from "../../../utils/size";
import NativeTooltip from "../../../utils/tooltip";
import { ProTag } from "../../premium/pro-tag";
import { PressableButton, PressableButtonProps } from "../pressable";
import Heading from "../typography/heading";
import Paragraph from "../typography/paragraph";
export interface ButtonProps extends PressableButtonProps {
  height?: number;
  icon?: string;
  fontSize?: number;
  tooltipText?: string;
  textStyle?: TextStyle;
  iconPosition?: "left" | "right";
  iconSize?: number;
  title?: string | null;
  loading?: boolean;
  width?: string | number | null;
  buttonType?: {
    text?: ColorValue;
    selected?: ColorValue;
    color?: ColorValue;
    opacity?: number;
    alpha?: number;
  };
  bold?: boolean;
  iconColor?: ColorValue;
  iconStyle?: TextStyle;
  proTag?: boolean;
}
export const Button = ({
  height = 45,
  width = null,
  onPress,
  loading = false,
  title = null,
  icon,
  fontSize = SIZE.sm,
  type = "transparent",
  iconSize = SIZE.md,
  style = {},
  accentColor = "accent",
  accentText = "light",
  onLongPress,
  tooltipText,
  textStyle,
  iconPosition = "left",
  buttonType,
  bold,
  iconColor,
  fwdRef,
  iconStyle,
  proTag,
  ...restProps
}: ButtonProps) => {
  const colors = useThemeStore((state) => state.colors);
  const premium = useUserStore((state) => state.premium);
  const textColor = buttonType?.text
    ? buttonType.text
    : (colors[
        type === "accent"
          ? (BUTTON_TYPES[type](accentColor, accentText).text as ColorKey)
          : (BUTTON_TYPES[type].text as ColorKey)
      ] as ColorValue);
  const Component = bold ? Heading : Paragraph;

  return (
    <PressableButton
      {...restProps}
      fwdRef={fwdRef}
      onPress={onPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress(event);
          return;
        }
        if (tooltipText) {
          NativeTooltip.show(event, tooltipText, NativeTooltip.POSITIONS.TOP);
        }
      }}
      disabled={loading}
      type={type}
      accentColor={accentColor}
      accentText={accentText}
      customColor={buttonType?.color}
      customSelectedColor={buttonType?.selected}
      customOpacity={buttonType?.opacity}
      customAlpha={buttonType?.alpha}
      customStyle={{
        height: height,
        width: width || undefined,
        paddingHorizontal: 12,
        borderRadius: 5,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        ...(style as ViewStyle)
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size={fontSize + 4} />
      ) : null}
      {icon && !loading && iconPosition === "left" ? (
        <Icon
          name={icon}
          style={[{ marginRight: 0 }, iconStyle]}
          color={iconColor || buttonType?.text || textColor}
          size={iconSize}
        />
      ) : null}

      {!title ? null : (
        <Component
          animated={false}
          color={textColor as string}
          size={fontSize}
          numberOfLines={1}
          style={[
            {
              marginLeft: icon || (loading && iconPosition === "left") ? 5 : 0,
              marginRight: icon || (loading && iconPosition === "right") ? 5 : 0
            },
            textStyle
          ]}
        >
          {title}
        </Component>
      )}
      {proTag && !premium ? (
        <View
          style={{
            marginLeft: 10
          }}
        >
          <ProTag size={10} width={40} background={colors.shade} />
        </View>
      ) : null}

      {icon && !loading && iconPosition === "right" ? (
        <Icon
          name={icon}
          style={[{ marginLeft: 0 }, iconStyle]}
          color={iconColor || buttonType?.text || textColor}
          size={iconSize}
        />
      ) : null}
    </PressableButton>
  );
};
