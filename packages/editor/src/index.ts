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

import { Theme } from "@notesnook/theme";
import {
  EditorOptions,
  extensions as TiptapCoreExtensions,
  getHTMLFromFragment
} from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import { Code } from "@tiptap/extension-code";
import Color from "@tiptap/extension-color";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Link } from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";
import "./extensions";
import { AttachmentNode, AttachmentOptions } from "./extensions/attachment";
import BulletList from "./extensions/bullet-list";
import { ClipboardTextSerializer } from "./extensions/clipboard-text-serializer";
import { CodeBlock } from "./extensions/code-block";
import { Codemark } from "./extensions/code-mark";
import { DateTime } from "./extensions/date-time";
import { EmbedNode } from "./extensions/embed";
import FontFamily from "./extensions/font-family";
import FontSize from "./extensions/font-size";
import { Highlight } from "./extensions/highlight";
import { ImageNode, ImageOptions } from "./extensions/image";
import { KeepInView } from "./extensions/keep-in-view";
import { KeyMap } from "./extensions/key-map";
import { ListItem } from "./extensions/list-item";
import { MathBlock, MathInline } from "./extensions/math";
import { OpenLink, OpenLinkOptions } from "./extensions/open-link";
import OrderedList from "./extensions/ordered-list";
import { OutlineList } from "./extensions/outline-list";
import { OutlineListItem } from "./extensions/outline-list-item";
import { Paragraph } from "./extensions/paragraph";
import {
  NodeViewSelectionNotifier,
  usePortalProvider
} from "./extensions/react";
import { SearchReplace } from "./extensions/search-replace";
import { SelectionPersist } from "./extensions/selection-persist";
import { Table } from "./extensions/table";
import TableCell from "./extensions/table-cell";
import { TaskItemNode } from "./extensions/task-item";
import { TaskListNode } from "./extensions/task-list";
import TextDirection from "./extensions/text-direction";
import { WebClipNode, WebClipOptions } from "./extensions/web-clip";
import { useEditor } from "./hooks/use-editor";
import { usePermissionHandler } from "./hooks/use-permission-handler";
import Toolbar from "./toolbar";
import { useToolbarStore } from "./toolbar/stores/toolbar-store";
import { DownloadOptions } from "./utils/downloader";

const CoreExtensions = Object.entries(TiptapCoreExtensions)
  // we will implement our own customized clipboard serializer
  .filter(([name]) => name !== "ClipboardTextSerializer")
  .map(([, extension]) => extension);

type TiptapOptions = EditorOptions &
  Omit<AttachmentOptions, "HTMLAttributes"> &
  Omit<WebClipOptions, "HTMLAttributes"> &
  Omit<ImageOptions, "HTMLAttributes"> &
  OpenLinkOptions & {
    downloadOptions?: DownloadOptions;
    theme: Theme;
    isMobile?: boolean;
    isKeyboardOpen?: boolean;
    doubleSpacedLines?: boolean;
  };

const useTiptap = (
  options: Partial<TiptapOptions> = {},
  deps: React.DependencyList = []
) => {
  const {
    theme,
    doubleSpacedLines = true,
    isMobile,
    isKeyboardOpen,
    onDownloadAttachment,
    onOpenAttachmentPicker,
    onPreviewAttachment,
    onOpenLink,
    onBeforeCreate,
    downloadOptions,
    ...restOptions
  } = options;
  const PortalProviderAPI = usePortalProvider();
  const setIsMobile = useToolbarStore((store) => store.setIsMobile);
  const setTheme = useToolbarStore((store) => store.setTheme);
  const closeAllPopups = useToolbarStore((store) => store.closeAllPopups);
  const setIsKeyboardOpen = useToolbarStore((store) => store.setIsKeyboardOpen);
  const setDownloadOptions = useToolbarStore(
    (store) => store.setDownloadOptions
  );

  useEffect(() => {
    setIsMobile(isMobile || false);
    setTheme(theme);
    setIsKeyboardOpen(isKeyboardOpen || false);
    setDownloadOptions(downloadOptions);
  }, [isMobile, theme, isKeyboardOpen, downloadOptions]);

  useEffect(() => {
    closeAllPopups();
  }, deps);

  const defaultOptions = useMemo<Partial<EditorOptions>>(
    () => ({
      enableCoreExtensions: false,
      extensions: [
        ...CoreExtensions,
        ClipboardTextSerializer,
        NodeViewSelectionNotifier,
        SearchReplace,
        TextStyle,
        Paragraph.configure({
          doubleSpaced: doubleSpacedLines
        }),
        StarterKit.configure({
          code: false,
          codeBlock: false,
          listItem: false,
          orderedList: false,
          bulletList: false,
          paragraph: false,
          hardBreak: false,
          history: {
            depth: 200,
            newGroupDelay: 1000
          },
          dropcursor: {
            class: "drop-cursor"
          },
          horizontalRule: false
        }),
        HorizontalRule.extend({
          addInputRules() {
            return [
              {
                find: /^(?:---|—-|___\s|\*\*\*\s)$/,
                handler: ({ state, range, commands }) => {
                  commands.splitBlock();

                  const attributes = {};
                  const { tr } = state;
                  const start = range.from;
                  const end = range.to;
                  tr.replaceWith(start - 1, end, this.type.create(attributes));
                }
              }
            ];
          }
        }),
        CharacterCount,
        Underline,
        Subscript,
        Superscript,
        FontSize,
        TextDirection,
        FontFamily,
        BulletList,
        OrderedList,
        TaskItemNode.configure({ nested: true }),
        TaskListNode,
        Link.extend({
          inclusive: true
        }).configure({
          openOnClick: !isMobile,
          autolink: false
        }),
        Table.configure({
          resizable: true,
          allowTableNodeSelection: true,
          cellMinWidth: 50
        }),
        TableRow,
        TableCell,
        TableHeader,
        Highlight,
        CodeBlock,
        Color,
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "right", "center", "justify"],
          defaultAlignment: "left"
        }),
        Placeholder.configure({
          placeholder: "Start writing your note..."
        }),
        OpenLink.configure({
          onOpenLink
        }),
        ImageNode.configure({ allowBase64: true }),
        EmbedNode,
        AttachmentNode.configure({
          onDownloadAttachment,
          onOpenAttachmentPicker,
          onPreviewAttachment
        }),
        OutlineListItem,
        OutlineList,
        ListItem,
        Code.extend({ excludes: "" }),
        Codemark,
        MathInline,
        MathBlock,
        KeepInView,
        SelectionPersist,
        DateTime,
        KeyMap,
        WebClipNode
      ],
      onBeforeCreate: ({ editor }) => {
        editor.storage.portalProviderAPI = PortalProviderAPI;
        if (onBeforeCreate) onBeforeCreate({ editor });
      },
      injectCSS: false
    }),
    [
      onPreviewAttachment,
      onDownloadAttachment,
      onOpenAttachmentPicker,
      PortalProviderAPI,
      onBeforeCreate,
      onOpenLink
    ]
  );

  const editor = useEditor(
    {
      ...defaultOptions,
      ...restOptions
    },
    deps
  );

  return editor;
};

export { type Fragment } from "prosemirror-model";
export { type Attachment, type AttachmentType } from "./extensions/attachment";
export * from "./extensions/react";
export * from "./toolbar";
export * from "./types";
export * from "./utils/word-counter";
export {
  useTiptap,
  Toolbar,
  usePermissionHandler,
  getHTMLFromFragment,
  type DownloadOptions
};
