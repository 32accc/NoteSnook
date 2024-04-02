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
import { markInputRule, markPasteRule } from "@tiptap/core";
import TiptapLink from "@tiptap/extension-link";

const linkRegex = /(?:__|[*#])|\[(.*?)\]\(.*?\)/gm;
const regExp = /(?:__|[*#])|\[.*?\]\((.*?)\)/gm;

export const Link = TiptapLink.extend({
  addInputRules() {
    return [
      ...(this.parent?.() || []),
      markInputRule({
        find: linkRegex,
        type: this.type,
        getAttributes: (match) => {
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      })
    ];
  },
  addPasteRules() {
    return [
      ...(this.parent?.() || []),
      markPasteRule({
        find: linkRegex,
        type: this.type,
        getAttributes(match) {
          return {
            href: regExp.exec(match[0])?.[1]
          };
        }
      })
    ];
  },
  addKeyboardShortcuts() {
    return {
      Space: ({ editor }) => {
        const { from, to } = editor.state.selection;
        let found;

        editor.state.doc.nodesBetween(from, to + 1, (node) => {
          found = node.marks.find(
            (mark) => mark.type === editor.state.schema.marks.link
          );
        });

        if (!found) {
          const { tr } = editor.state;
          tr.removeStoredMark(editor.schema.marks.link);
          editor.view.dispatch(tr);
        }

        return false;
      }
    };
  }
});
