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

import { Perform } from "../../common/dialog-controller";
import Dialog from "./dialog";
import Field from "../field";
import { Box, Button, Flex, Label, Radio, Text } from "@theme-ui/components";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { db } from "../../common/db";
import { useStore } from "../../stores/reminder-store";
import { showToast } from "../../utils/toast";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { Pro } from "../icons";

export type AddReminderDialogProps = {
  onClose: Perform;
  reminderId?: string;
};

type ValueOf<T> = T[keyof T];

const Modes = {
  ONCE: "once",
  REPEAT: "repeat",
  PERMANENT: "permanent"
} as const;

const Priorities = {
  SILENT: "silent",
  VIBRATE: "vibrate",
  URGENT: "urgent"
} as const;

const RecurringModes = {
  WEEK: "week",
  MONTH: "month",
  DAY: "day"
} as const;

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
const modes = [
  {
    id: Modes.ONCE,
    title: "Once"
  },
  {
    id: Modes.REPEAT,
    title: "Repeat",
    premium: true
  }
];
const priorities = [
  {
    id: Priorities.SILENT,
    title: "Silent"
  },
  {
    id: Priorities.VIBRATE,
    title: "Vibrate"
  },
  {
    id: Priorities.URGENT,
    title: "Urgent"
  }
];
const recurringModes = [
  {
    id: RecurringModes.DAY,
    title: "Daily",
    options: []
  },
  {
    id: RecurringModes.WEEK,
    title: "Weekly",
    options: WEEK_DAYS
  },
  {
    id: RecurringModes.MONTH,
    title: "Monthly",
    options: new Array(31).fill(0).map((_, i) => i + 1)
  }
];

export default function AddReminderDialog(props: AddReminderDialogProps) {
  const { reminderId } = props;

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurringMode, setRecurringMode] = useState<
    ValueOf<typeof RecurringModes>
  >(RecurringModes.DAY);
  const [mode, setMode] = useState<ValueOf<typeof Modes>>(Modes.ONCE);
  const [priority, setPriority] = useState<ValueOf<typeof Priorities>>(
    Priorities.VIBRATE
  );
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [time, setTime] = useState(dayjs().format("HH:mm"));
  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const refresh = useStore((state) => state.refresh);
  const isUserPremium = useIsUserPremium();

  useEffect(() => {
    setSelectedDays([]);
  }, [recurringMode, mode]);

  useEffect(() => {
    setRecurringMode(RecurringModes.DAY);
  }, [mode]);

  useEffect(() => {
    if (!reminderId) return;
    const reminder = db.reminders?.reminder(reminderId);
    if (!reminder) return;

    setSelectedDays(reminder.selectedDays || []);
    setRecurringMode(reminder.recurringMode || RecurringModes.DAY);
    setMode(reminder.mode || Modes.ONCE);
    setPriority(reminder.priority || Priorities.VIBRATE);
    setDate(dayjs(reminder.date).format("YYYY-MM-DD"));
    setTime(dayjs(reminder.date).format("HH:mm"));
    setTitle(reminder.title);
    setDescription(reminder.description);
  }, [reminderId]);

  const repeatsDaily =
    (selectedDays.length === 7 && recurringMode === RecurringModes.WEEK) ||
    (selectedDays.length === 31 && recurringMode === RecurringModes.MONTH) ||
    recurringMode === RecurringModes.DAY;

  return (
    <Dialog
      isOpen={true}
      title={reminderId ? "Edit reminder" : "Add a reminder"}
      description={""}
      onClose={props.onClose}
      positiveButton={{
        text: reminderId ? "Save" : "Add",
        disabled:
          !title ||
          (mode !== Modes.ONCE &&
            recurringMode !== RecurringModes.DAY &&
            !selectedDays.length),
        onClick: async () => {
          if (!("Notification" in window))
            showToast(
              "warn",
              "Reminders will not be active on this device as it does not support notifications."
            );

          const permissionResult = await Notification.requestPermission();
          if (permissionResult !== "granted") {
            showToast(
              "error",
              "Please grant notifications permission to add new reminders."
            );
            return;
          }

          const dateTime = dayjs(getDateTime(date, time));

          if (dateTime.isBefore(dayjs())) {
            showToast(
              "error",
              "Reminder time cannot be earlier than the current time."
            );
            return;
          }

          await db.reminders?.add({
            id: reminderId,
            recurringMode,
            mode,
            priority,
            selectedDays,
            date: dateTime.valueOf(),
            title,
            description,
            disabled: false,
            ...(dateTime.isAfter(dayjs()) ? { snoozeUntil: 0 } : {})
          });
          refresh();
          props.onClose(true);
        }
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Field
        id="title"
        label="Title"
        required
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
      />
      <Field
        id="description"
        label="Description"
        helpText="Optional"
        value={description}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setDescription(e.target.value)
        }
      />
      <Flex sx={{ gap: 2, mt: 2 }}>
        {modes.map((m) => (
          <Label
            key={m.id}
            variant="text.body"
            sx={{
              width: "auto",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Radio
              id="mode"
              name="mode"
              defaultChecked={m.id === Modes.ONCE}
              checked={m.id === mode}
              disabled={m.premium && !isUserPremium}
              onChange={() => {
                if (m.premium && !isUserPremium) return;
                setMode(m.id);
              }}
            />
            {m.title}
            {m.premium && !isUserPremium && (
              <Pro size={18} color="primary" sx={{ ml: 1 }} />
            )}
          </Label>
        ))}
      </Flex>
      {mode === Modes.REPEAT ? (
        <Flex
          sx={{
            mt: 2,
            bg: "bgSecondary",
            borderRadius: "default",
            p: 1,
            flexDirection: "column"
          }}
        >
          <Flex sx={{ alignItems: "center", gap: 1 }}>
            {recurringModes.map((mode) => (
              <Button
                key={mode.id}
                variant="tool"
                onClick={() => setRecurringMode(mode.id)}
                sx={{
                  borderRadius: 100,
                  py: 1,
                  px: 2,
                  flexShrink: 0,
                  color: mode.id === recurringMode ? "primary" : "text"
                }}
              >
                {mode.title}
              </Button>
            ))}
          </Flex>
          {recurringModes.map((mode) =>
            mode.id === recurringMode ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    mode.id === RecurringModes.WEEK
                      ? "1fr 1fr 1fr"
                      : "1fr 1fr 1fr 1fr 1fr",
                  mt: mode.options.length > 0 ? 1 : 0,
                  maxHeight: 150,
                  overflowY: "auto",
                  gap: 1
                }}
              >
                {mode.options.map((day, i) => (
                  <Button
                    key={day}
                    variant="tool"
                    onClick={() => {
                      setSelectedDays((days) => {
                        const clone = days.slice();
                        if (clone.indexOf(i) > -1)
                          clone.splice(clone.indexOf(i), 1);
                        else clone.push(i);
                        return clone;
                      });
                    }}
                    sx={{
                      borderRadius: "default",
                      py: 1,
                      px: 2,
                      flexShrink: 0,
                      textAlign: "left",
                      bg: selectedDays.includes(i) ? "shade" : "bgSecondary",
                      color: selectedDays.includes(i) ? "primary" : "text"
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </Box>
            ) : null
          )}
        </Flex>
      ) : null}

      <Flex sx={{ gap: 2, overflowX: "auto", mt: 2 }}>
        {mode === Modes.ONCE ? (
          <Field
            id="date"
            label="Date"
            required
            type="date"
            min={dayjs().format("YYYY-MM-DD")}
            defaultValue={date}
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const date = dayjs(e.target.value);
              setDate(date.format("YYYY-MM-DD"));
            }}
          />
        ) : null}
        <Field
          id="time"
          label="Time"
          required
          type="time"
          defaultValue={time}
          value={time}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTime(e.target.value);
          }}
        />
      </Flex>
      <Flex sx={{ gap: 2, mt: 2 }}>
        {priorities.map((p) => (
          <Label
            key={p.id}
            variant="text.body"
            sx={{
              width: "auto",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Radio
              id="priority"
              name="priority"
              defaultChecked={p.id === Priorities.VIBRATE}
              checked={p.id === priority}
              onChange={() => setPriority(p.id)}
            />
            {p.title}
          </Label>
        ))}
      </Flex>

      {mode === Modes.REPEAT ? (
        <Text variant="subBody" sx={{ mt: 1 }}>
          {selectedDays.length === 0 && recurringMode !== RecurringModes.DAY
            ? recurringMode === RecurringModes.WEEK
              ? "Select day of the week to repeat the reminder."
              : "Select nth day(s) of the month to repeat the reminder."
            : repeatsDaily
            ? `Repeats daily at ${dayjs(getDateTime(date, time)).format(
                "hh:mm A"
              )}.`
            : `Repeats every ${recurringMode} on ${getSelectedDaysText(
                selectedDays,
                recurringMode
              )} at ${dayjs(getDateTime(date, time)).format("hh:mm A")}.`}
        </Text>
      ) : (
        <Text variant="subBody" sx={{ mt: 1 }}>
          {`The reminder will start on ${date} at ${dayjs(
            getDateTime(date, time)
          ).format("hh:mm A")}.`}
        </Text>
      )}
    </Dialog>
  );
}

function getDateTime(date: string, time: string) {
  return `${date} ${time}`;
}

function getSelectedDaysText(
  selectedDays: number[],
  recurringMode: ValueOf<typeof RecurringModes>
) {
  const text = selectedDays
    .sort((a, b) => a - b)
    .map((day, index) => {
      const isLast = index === selectedDays.length - 1;
      const isSecondLast = index === selectedDays.length - 2;
      const joinWith = isSecondLast ? " & " : isLast ? "" : ", ";
      return recurringMode === RecurringModes.WEEK
        ? WEEK_DAYS[day] + joinWith
        : `${day + 1}${nth(day + 1)} ${joinWith}`;
    })
    .join("");
  return text;
}

function nth(n: number) {
  return (
    ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    "th"
  );
}
