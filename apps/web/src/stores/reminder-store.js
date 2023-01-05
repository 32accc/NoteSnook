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

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { groupArray } from "@notesnook/core/utils/grouping";
import { TaskScheduler } from "../utils/task-scheduler";
import { showReminderPreviewDialog } from "../common/dialog-controller";
import dayjs from "dayjs";

class ReminderStore extends BaseStore {
  reminders = [];

  refresh = (reset = true) => {
    const reminders = db.reminders.all;
    this.set(
      (state) =>
        (state.reminders = groupArray(
          reminders,
          db.settings.getGroupOptions("reminders")
        ))
    );
    if (reset) resetReminders(reminders);
  };

  delete = async (...ids) => {
    await db.reminders.remove(...ids);
    this.refresh();
  };
}

/**
 * @type {[import("zustand").UseStore<ReminderStore>, ReminderStore]}
 */
const [useStore, store] = createStore(ReminderStore);
export { useStore, store };

async function resetReminders(reminders) {
  await TaskScheduler.stopAllWithPrefix("reminder:");

  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  for (const reminder of reminders) {
    if (reminder.disabled) continue;

    // set a one time reminder at the snoozed date
    if (reminder.snoozeUntil > Date.now()) {
      await scheduleReminder(
        `${reminder.id}-snoozed`,
        reminder,
        reminderToCronExpression({ mode: "once", date: reminder.snoozeUntil })
      );
    }

    await scheduleReminder(
      reminder.id,
      reminder,
      reminderToCronExpression(reminder)
    );
  }
}

function scheduleReminder(id, reminder, cron) {
  return TaskScheduler.register(`reminder:${id}`, cron, () => {
    const notification = new Notification(reminder.title, {
      body: reminder.description,
      vibrate: reminder.priority === "vibrate",
      silent: reminder.priority === "silent",
      tag: id,
      renotify: true,
      requireInteraction: true
    });

    notification.onclick = function () {
      showReminderPreviewDialog(reminder);
    };

    store.refresh(false);
  });
}

function reminderToCronExpression(reminder) {
  const { date, recurringMode, selectedDays, mode } = reminder;
  const dateTime = dayjs(date);

  if (mode === "once") {
    return dateTime.format("ss mm HH DD MM * YYYY");
  } else {
    const cron = dateTime.format("ss mm HH").split(" ");
    if (recurringMode === "week") {
      cron.push("*"); // day of month
      cron.push("*"); // month
      cron.push(selectedDays.sort((a, b) => a - b).join(",")); // day of week
      cron.push("*"); // year
    } else if (recurringMode === "month") {
      cron.push(
        selectedDays
          .sort((a, b) => a - b)
          .map((a) => ++a)
          .join(",")
      ); // day of month
      cron.push("*"); // month
      cron.push("*"); // day of week
      cron.push("*"); // year
    } else if (recurringMode === "day") {
      cron.push("*"); // day of month
      cron.push("*"); // month
      cron.push("*"); // day of week
      cron.push("*"); // year
    }
    return cron.join(" ");
  }
}
