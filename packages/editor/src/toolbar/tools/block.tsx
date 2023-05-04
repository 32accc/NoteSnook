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

import { ToolProps } from "../types";
import { Editor } from "../../types";
import { Icons } from "../icons";
import { useMemo, useRef, useState } from "react";
import { Icon } from "../components/icon";
import { EmbedPopup } from "../popups/embed-popup";
import { TablePopup } from "../popups/table-popup";
import { MenuItem } from "../../components/menu/types";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store";
import { ResponsivePresenter } from "../../components/responsive";
import { showPopup } from "../../components/popup-presenter";
import { ImageUploadPopup } from "../popups/image-upload";
import { Button } from "../../components/button";

export function InsertBlock(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();

  const menuItems = useMemo(
    () => {
      return [
        tasklist(editor),
        outlinelist(editor),
        horizontalRule(editor),
        codeblock(editor),
        mathblock(editor),
        blockquote(editor),
        image(editor, isMobile),
        attachment(editor),
        isMobile ? embedMobile(editor) : embedDesktop(editor),
        table(editor)
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile]
  );

  return (
    <>
      <Button
        ref={buttonRef}
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "hover" : "transparent",
          mr: 1,
          display: "flex",
          alignItems: "center",
          ":hover": { bg: "hover" },
          ":last-of-type": {
            mr: 0
          }
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen((s) => !s)}
      >
        <Icon path={Icons.plus} size={18} color={"accent"} />
      </Button>

      <ResponsivePresenter
        desktop="menu"
        mobile="sheet"
        title="Choose a block to insert"
        isOpen={isOpen}
        items={menuItems}
        onClose={() => setIsOpen(false)}
        position={{
          target: buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: toolbarLocation === "bottom" ? "top" : "below",
          yOffset: 5
        }}
      />
    </>
  );
}

const horizontalRule = (editor: Editor): MenuItem => ({
  key: "hr",
  type: "button",
  title: "Horizontal rule",
  icon: "horizontalRule",
  isChecked: editor?.isActive("horizontalRule"),
  onClick: () => editor.current?.chain().focus().setHorizontalRule().run()
});

const codeblock = (editor: Editor): MenuItem => ({
  key: "codeblock",
  type: "button",
  title: "Code block",
  icon: "codeblock",
  isChecked: editor?.isActive("codeBlock"),
  onClick: () => editor.current?.chain().focus().toggleCodeBlock().run()
});

const blockquote = (editor: Editor): MenuItem => ({
  key: "blockquote",
  type: "button",
  title: "Quote",
  icon: "blockquote",
  isChecked: editor?.isActive("blockQuote"),
  onClick: () => editor.current?.chain().focus().toggleBlockquote().run()
});

const mathblock = (editor: Editor): MenuItem => ({
  key: "math",
  type: "button",
  title: "Math & formulas",
  icon: "mathBlock",
  isChecked: editor?.isActive("mathBlock"),
  onClick: () => editor.current?.chain().focus().insertMathBlock().run()
});

const image = (editor: Editor, isMobile: boolean): MenuItem => ({
  key: "image",
  type: "button",
  title: "Image",
  icon: "image",
  menu: {
    title: "Insert an image",
    items: [
      {
        key: "upload-from-disk",
        type: "button",
        title: "Upload from disk",
        icon: "upload",
        onClick: () =>
          editor.current?.chain().focus().openAttachmentPicker("image").run()
      },
      {
        key: "camera",
        type: "button",
        title: "Take a photo using camera",
        icon: "camera",
        isHidden: !isMobile,
        onClick: () =>
          editor.current?.chain().focus().openAttachmentPicker("camera").run()
      },
      isMobile ? uploadImageFromURLMobile(editor) : uploadImageFromURL(editor)
    ]
  }
});

const table = (editor: Editor): MenuItem => ({
  key: "table",
  type: "button",
  title: "Table",
  icon: "table",
  menu: {
    title: "Insert a table",
    items: [
      {
        key: "table-size-selector",
        type: "popup",
        component: (props) => (
          <TablePopup
            onInsertTable={(size) => {
              editor.current
                ?.chain()
                .focus()
                .insertTable({
                  rows: size.rows,
                  cols: size.columns
                })
                .run();
              props.onClick?.();
            }}
          />
        )
      }
    ]
  }
});

const embedMobile = (editor: Editor): MenuItem => ({
  key: "embed",
  type: "button",
  title: "Embed",
  icon: "embed",
  menu: {
    title: "Insert an embed",
    items: [
      {
        key: "embed-popup",
        type: "popup",
        component: function ({ onClick }) {
          return (
            <EmbedPopup
              title="Insert embed"
              onClose={(embed) => {
                if (!embed) return onClick?.();
                editor.current?.chain().insertEmbed(embed).run();
                onClick?.();
              }}
            />
          );
        }
      }
    ]
  }
});

const embedDesktop = (editor: Editor): MenuItem => ({
  key: "embed",
  type: "button",
  title: "Embed",
  icon: "embed",
  onClick: () => {
    if (!editor) return;
    showPopup({
      popup: (hide) => (
        <EmbedPopup
          title="Insert embed"
          onClose={(embed) => {
            if (!embed) return hide();
            editor.current?.chain().insertEmbed(embed).run();
            hide();
          }}
        />
      )
    });
  }
});

const attachment = (editor: Editor): MenuItem => ({
  key: "attachment",
  type: "button",
  title: "Attachment",
  icon: "attachment",
  isChecked: editor?.isActive("attachment"),
  onClick: () =>
    editor.current?.chain().focus().openAttachmentPicker("file").run()
});

const tasklist = (editor: Editor): MenuItem => ({
  key: "tasklist",
  type: "button",
  title: "Task list",
  icon: "checkbox",
  isChecked: editor?.isActive("taskList"),
  onClick: () => editor.current?.chain().focus().toggleTaskList().run()
});

const outlinelist = (editor: Editor): MenuItem => ({
  key: "outlinelist",
  type: "button",
  title: "Outline list",
  icon: "outlineList",
  isChecked: editor?.isActive("outlineList"),
  onClick: () => editor.current?.chain().focus().toggleOutlineList().run()
});

const uploadImageFromURLMobile = (editor: Editor): MenuItem => ({
  key: "upload-from-url",
  type: "button",
  title: "Attach from URL",
  icon: "link",
  menu: {
    title: "Attach image from URL",
    items: [
      {
        key: "attach-image",
        type: "popup",
        component: ({ onClick }) => (
          <ImageUploadPopup
            onInsert={(image) => {
              editor
                .requestPermission("insertImage")
                ?.chain()
                .focus()
                .insertImage(image)
                .run();
              onClick?.();
            }}
            onClose={() => {
              onClick?.();
            }}
          />
        )
      }
    ]
  }
});

const uploadImageFromURL = (editor: Editor): MenuItem => ({
  key: "upload-from-url",
  type: "button",
  title: "Attach from URL",
  icon: "link",
  onClick: () => {
    showPopup({
      popup: (hide) => (
        <ImageUploadPopup
          onInsert={(image) => {
            editor
              .requestPermission("insertImage")
              ?.chain()
              .focus()
              .insertImage(image)
              .run();
            hide();
          }}
          onClose={hide}
        />
      )
    });
  }
});
