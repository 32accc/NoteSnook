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

import {
  Extension,
  InputRule,
  InputRuleFinder,
  ExtendedRegExpMatchArray
} from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    datetime: {
      /**
       * Insert time at current position
       */
      insertTime: () => ReturnType;
      /**
       * Insert date at current position
       */
      insertDate: () => ReturnType;

      /**
       * Insert date & time at current position
       */
      insertDateTime: () => ReturnType;
    };
  }
}

export const DateTime = Extension.create({
  name: "datetime",
  addKeyboardShortcuts() {
    return {
      "Alt-t": ({ editor }) => editor.commands.insertTime(),
      "Alt-d": ({ editor }) => editor.commands.insertDate(),
      "Mod-Alt-d": ({ editor }) => editor.commands.insertDateTime()
    };
  },

  addCommands() {
    return {
      insertDate:
        () =>
        ({ commands }) =>
          commands.insertContent(currentDate()),
      insertTime:
        () =>
        ({ commands }) =>
          commands.insertContent(currentTime()),
      insertDateTime:
        () =>
        ({ commands }) =>
          commands.insertContent(currentDateTime())
    };
  },

  addInputRules() {
    return [
      shortcutInputRule({
        shortcut: "/time",
        replace: () => {
          return currentTime();
        }
      }),
      shortcutInputRule({
        shortcut: "/date",
        replace: () => {
          return currentDate();
        }
      }),
      shortcutInputRule({
        shortcut: "/now",
        replace: () => {
          return currentDateTime();
        }
      })
    ];
  }
});

function currentTime() {
  return new Date().toLocaleTimeString(window.navigator.languages.slice(), {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function currentDateTime() {
  return `${currentDate()}, ${currentTime()}`;
}

function currentDate() {
  return new Date().toLocaleDateString(window.navigator.languages.slice(), {
    month: "long",
    day: "2-digit",
    year: "numeric"
  });
}

function shortcutInputRule(config: {
  shortcut: string;
  replace: () => string;
}) {
  const regex = new RegExp(`(^| )${config.shortcut}(\\s)`, "i");
  return textInputRule({
    find: regex,
    replace: (match) => {
      const endToken = match[2] === "\n" ? "" : match[2];
      return `${match[1]}${config.replace()}${endToken}`;
    },
    after: ({ match, state, range }) => {
      const newlineRequested = match[2] === "\n";
      if (newlineRequested) state.tr.split(state.tr.mapping.map(range.to));
    }
  });
}

function textInputRule(config: {
  find: InputRuleFinder;
  replace: (match: ExtendedRegExpMatchArray) => string;
  after?: InputRule["handler"];
}) {
  return new InputRule({
    find: config.find,
    handler: (props) => {
      const { state, range, match } = props;
      const insert = config.replace(match);
      const start = range.from;
      const end = range.to;

      state.tr.insertText(insert, start, end);

      if (config.after) config.after(props);
    }
  });
}
