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

import getId from "../utils/id";
import Collection from "./collection";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isTomorrow);
dayjs.extend(isSameOrBefore);
dayjs.extend(isYesterday);
dayjs.extend(isToday);
dayjs.extend(isBetween);

/**
 * @typedef {{
 *  id: string;
 *  type: string;
 *  title: string;
 *  description?: string;
 *  priority: "silent" | "vibrate" | "urgent";
 *  date: number;
 *  mode: "repeat" | "once" | "permanent";
 *  recurringMode?: "week" | "month" | "day";
 *  selectedDays?: number[];
 *  dateCreated: number;
 *  dateModified: number;
 *  localOnly?: boolean;
 *  disabled?: boolean;
 *  snoozeUntil?: number;
 * }} Reminder
 *
 */

export default class Reminders extends Collection {
  async merge(reminder) {
    if (!reminder) return;
    await this._collection.addItem(reminder);
  }

  /**
   *
   * @param {Partial<Reminder>} reminder
   * @returns
   */
  async add(reminder) {
    if (!reminder) return;
    if (reminder.remote)
      throw new Error("Please use db.reminders.merge to merge reminders.");

    const id = reminder.id || getId();
    let oldReminder = this._collection.getItem(id);

    reminder = {
      ...oldReminder,
      ...reminder
    };

    reminder = {
      id,
      type: "reminder",
      dateCreated: reminder.dateCreated,
      dateModified: reminder.dateModified,
      date: reminder.date,
      description: reminder.description,
      mode: reminder.mode || "once",
      priority: reminder.priority || "vibrate",
      recurringMode: reminder.recurringMode,
      selectedDays: reminder.selectedDays || [],
      title: reminder.title,
      localOnly: reminder.localOnly,
      disabled: reminder.disabled,
      snoozeUntil: reminder.snoozeUntil
    };

    await this._collection.addItem(reminder);
    return reminder.id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @return {Reminder[]}
   */
  get all() {
    return this._collection.getItems();
  }

  exists(itemId) {
    return !!this.shortcut(itemId);
  }

  reminder(id) {
    return this.all.find((reminder) => reminder.id === id);
  }

  async remove(...reminderIds) {
    for (const id of reminderIds) {
      await this._collection.removeItem(id);
    }
  }
}

/**
 * @param {Reminder} reminder
 */
export function formatReminderTime(reminder) {
  const { date } = reminder;
  let time = date;
  if (reminder.mode === "repeat") {
    time = getUpcomingReminderTime(reminder);
  }

  if (dayjs(time).isTomorrow()) {
    return `Upcoming: Tomorrow, ${dayjs(time).format("hh:mm A")}`;
  }

  if (dayjs(time).isYesterday()) {
    return `Last: Yesterday, ${dayjs(time).format("hh:mm A")}`;
  }

  const isPast = dayjs(time).isSameOrBefore(dayjs());
  const tag = isPast ? "Last" : "Upcoming";
  if (dayjs(time).isToday()) {
    return `${tag}: Today, ${dayjs(time).format("hh:mm A")}`;
  }

  return dayjs(time).format(`[${tag}]: ddd, YYYY-MM-DD hh:mm A`);
}

/**
 * @param {Reminder} reminder
 */
function getUpcomingReminderTime(reminder) {
  // this is only the time (hour & minutes); date is not included
  const time = dayjs(reminder.date);
  const now = dayjs();
  const relativeTime = now.clone().hour(time.hour()).minute(time.minute());

  const isPast = relativeTime.isBefore(now);

  const isDay = reminder.recurringMode === "day";
  const isWeek = reminder.recurringMode === "week";
  const isMonth = reminder.recurringMode === "month";

  if (isDay) {
    if (isPast) return relativeTime.add(1, "day").valueOf();
    else return relativeTime.valueOf();
  }

  if (!reminder.selectedDays || !reminder.selectedDays.length)
    return relativeTime.valueOf();

  const sorted = reminder.selectedDays.sort((a, b) => a - b);
  const lastSelectedDay = sorted[sorted.length - 1];

  if (isWeek) {
    if (now.day() > lastSelectedDay)
      return relativeTime.day(sorted[0]).add(1, "week").valueOf();
    else {
      for (const day of reminder.selectedDays)
        if (now.day() < day) return relativeTime.day(day).valueOf();
    }
  } else if (isMonth) {
    if (now.date() > lastSelectedDay)
      return relativeTime.date(sorted[0]).add(1, "month").valueOf();
    else {
      for (const day of reminder.selectedDays)
        if (now.date() < day) return relativeTime.date(day).valueOf();
    }
  }

  return relativeTime.valueOf();
}

export function getUpcomingReminder(reminders) {
  const sorted = reminders.sort((a, b) => {
    const d1 = a.mode === "repeat" ? getUpcomingReminderTime(a) : a.date;
    const d2 = a.mode === "repeat" ? getUpcomingReminderTime(b) : b.date;
    return !d1 || !d2 ? 0 : d1 - d2;
  });
  return sorted[0];
}
