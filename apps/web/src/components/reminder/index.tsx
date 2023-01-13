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
import ListItem from "../list-item";
import { Flex } from "@theme-ui/components";
import * as Icon from "../icons";
import IconTag from "../icon-tag";
import {
  Reminder as ReminderType,
  formatReminderTime,
  isReminderToday
} from "@notesnook/core/collections/reminders";
import { hashNavigate } from "../../navigation";
import { Multiselect } from "../../common/multi-select";
import { store } from "../../stores/reminder-store";
import { db } from "../../common/db";
import { showEditReminderDialog } from "../../common/dialog-controller";

const RECURRING_MODE_MAP = {
  week: "Weekly",
  day: "Daily",
  month: "Monthly"
} as const;

const PRIORITY_ICON_MAP = {
  silent: Icon.Silent,
  vibrate: Icon.Vibrate,
  urgent: Icon.Loud
} as const;

function Reminder({
  item,
  index,
  simplified
}: {
  item: ReminderType;
  index: number;
  simplified?: boolean;
}) {
  const reminder = item;
  const PriorityIcon = PRIORITY_ICON_MAP[reminder.priority];
  return (
    <ListItem
      selectable
      item={reminder}
      title={reminder.title}
      body={reminder.description}
      isDisabled={reminder.disabled}
      isSimple={simplified}
      onClick={() => showEditReminderDialog(reminder.id)}
      footer={
        <Flex
          sx={{
            alignItems: "center"
          }}
        >
          {reminder.disabled ? (
            <IconTag
              icon={Icon.ReminderOff}
              text={"Disabled"}
              styles={{ icon: { color: "error" } }}
            />
          ) : (
            <IconTag
              icon={Icon.Clock}
              text={formatReminderTime(reminder)}
              highlight={isReminderToday(reminder)}
            />
          )}
          {reminder.disabled ? null : (
            <PriorityIcon size={14} color="fontTertiary" sx={{ ml: 1 }} />
          )}
          {reminder.mode === "repeat" && reminder.recurringMode && (
            <IconTag
              icon={Icon.Refresh}
              text={RECURRING_MODE_MAP[reminder.recurringMode]}
            />
          )}
        </Flex>
      }
      index={index}
      menu={{
        items: menuItems,
        extraData: { reminder }
      }}
    />
  );
}

export default React.memo(Reminder, (prev, next) => {
  return prev?.item?.title === next?.item?.title;
});

type MenuActionParams = {
  reminder: ReminderType;
  items: ReminderType[];
};

type MenuItemValue<T> = T | ((options: MenuActionParams) => T);

const menuItems: {
  key: string;
  title: MenuItemValue<string>;
  icon: MenuItemValue<Icon.Icon>;
  onClick: (options: MenuActionParams) => void;
  color?: MenuItemValue<string>;
  iconColor?: MenuItemValue<string>;
  multiSelect?: boolean;
}[] = [
  {
    key: "edit",
    title: "Edit",
    icon: Icon.Edit,
    onClick: ({ reminder }) => hashNavigate(`/reminders/${reminder.id}/edit`)
  },
  {
    key: "toggle",
    title: ({ reminder }) => (reminder.disabled ? "Turn on" : "Turn off"),
    icon: ({ reminder }: MenuActionParams) =>
      reminder.disabled ? Icon.Reminders : Icon.ReminderOff,
    onClick: async ({ reminder }) => {
      await db.reminders?.add({
        id: reminder.id,
        disabled: !reminder.disabled
      });
      store.refresh();
    }
  },
  {
    key: "delete",
    title: "Delete",
    color: "error",
    iconColor: "error",
    icon: Icon.Trash,
    onClick: async ({ items }) => {
      await Multiselect.moveRemindersToTrash(items);
    },
    multiSelect: true
  }
];
