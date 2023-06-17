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
import { isReminderActive } from "@notesnook/core/collections/reminders";
import React from "react";
import { ViewStyle } from "react-native";

import { Reminder } from "../../../services/notifications";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { Button, ButtonProps } from "../button";
import { getFormattedReminderTime } from "@notesnook/common";

export const ReminderTime = ({
  checkIsActive = true,
  style,
  ...props
}: {
  short?: boolean;
  onPress?: () => void;
  reminder?: Reminder;
  color?: string;
  style?: ViewStyle;
  checkIsActive?: boolean;
} & ButtonProps) => {
  const colors = useThemeStore((state) => state.colors);
  const reminder = props.reminder;
  const time = !reminder ? undefined : getFormattedReminderTime(reminder);
  const isTodayOrTomorrow =
    (time?.includes("Today") || time?.includes("Tomorrow")) &&
    !time?.includes("Last");
  const isActive =
    checkIsActive && reminder ? isReminderActive(reminder) : true;

  return reminder && isActive ? (
    <Button
      title={time}
      key={reminder.id}
      height={20}
      icon="bell"
      fontSize={SIZE.xs}
      iconSize={SIZE.sm}
      type="grayBg"
      buttonType={
        isTodayOrTomorrow
          ? {
              text: props.color || colors.accent
            }
          : undefined
      }
      textStyle={{
        marginRight: 0
      }}
      style={{
        borderRadius: 5,
        marginRight: 5,
        borderWidth: 0.5,
        borderColor: colors.icon,
        paddingHorizontal: 6,
        marginBottom: 5,
        ...(style as ViewStyle)
      }}
      {...props}
      onPress={props.onPress}
    />
  ) : null;
};
