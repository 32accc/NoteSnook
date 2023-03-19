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

import { marked } from "marked";

const emoji: marked.TokenizerExtension & marked.RendererExtension = {
  name: "emoji",
  level: "inline",
  start(src) {
    return src.indexOf(":");
  },
  tokenizer(src, _tokens) {
    const rule = /^:(\w+):/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: "emoji",
        raw: match[0],
        emoji: match[1]
      };
    }
  },
  renderer(token) {
    return `<span className="emoji ${token}" />`;
  }
};

const renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
  return `<a target="_blank" rel="noopener noreferrer" href="${href}" ${
    title ? `title=${title}` : ""
  }>${text}</a>`;
};
marked.use({ extensions: [emoji] });

export function mdToHtml(markdown: string) {
  return marked.parse(markdown, { async: false, renderer, gfm: true });
}
