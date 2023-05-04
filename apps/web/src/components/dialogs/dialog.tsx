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

import React from "react";
import { Flex, Text, Button, ButtonProps } from "@theme-ui/components";
import * as Icon from "../icons";
import ReactModal from "react-modal";
import { FlexScrollContainer } from "../scroll-container";

ReactModal.setAppElement("#root");

type DialogButtonProps = ButtonProps & {
  onClick?: () => void;
  disabled?: boolean;
  text: JSX.Element | string;
  loading?: boolean;
};

type DialogProps = {
  isOpen?: boolean;
  onClose?: (
    event?: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>
  ) => void;
  onOpen?: () => void;
  width?: number | string;
  showCloseButton?: boolean;
  textAlignment?: "left" | "right" | "center";
  buttonsAlignment?: "start" | "center" | "end";
  title?: string;
  description?: string;
  positiveButton?: DialogButtonProps | null;
  negativeButton?: DialogButtonProps | null;
  footer?: React.Component;
};

function BaseDialog(props: React.PropsWithChildren<DialogProps>) {
  // const theme: any = useTheme();
  return (
    <ReactModal
      isOpen={props.isOpen || false}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => onAfterOpen(e, props)}
      style={{
        content: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: undefined,
          padding: 0,
          overflowY: "hidden",
          border: 0,
          zIndex: 0
        },
        overlay: {
          zIndex: 999,
          background: "var(--overlay)"
        }
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          width: ["100%", "90%", props.width || "380px"],
          maxHeight: ["100%", "80%", "70%"],
          height: ["100%", "auto", "auto"],
          bg: "background",
          alignSelf: "center",
          overflowY: "hidden",

          justifyContent: "stretch",
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog"
        }}
      >
        {props.showCloseButton && (
          <Icon.Close
            sx={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              right: 20,
              mt: 26,
              zIndex: 999
            }}
            size={20}
            onClick={props.onClose}
          />
        )}
        <Flex sx={{ flexDirection: "column" }} p={4} pb={0}>
          <Text
            variant="heading"
            sx={{
              fontSize: "subheading",
              textAlign: props.textAlignment || "left",
              color: "paragraph"
            }}
          >
            {props.title}
          </Text>
          {props.description && (
            <Text
              variant="body"
              sx={{
                textAlign: props.textAlignment || "left",
                color: "fontTertiary"
              }}
            >
              {props.description}
            </Text>
          )}
        </Flex>
        <Flex variant="columnFill" sx={{ overflowY: "hidden" }} my={1}>
          <FlexScrollContainer style={{ paddingRight: 20, paddingLeft: 20 }}>
            {props.children}
          </FlexScrollContainer>
        </Flex>

        {(props.positiveButton || props.negativeButton) && (
          <Flex
            sx={{ justifyContent: props.buttonsAlignment || "end" }}
            bg="bgSecondary"
            p={1}
            px={2}
            mt={2}
          >
            {props.negativeButton && (
              <DialogButton
                {...props.negativeButton}
                color="text"
                data-test-id="dialog-no"
              />
            )}
            {props.positiveButton && (
              <DialogButton
                {...props.positiveButton}
                color="primary"
                data-test-id="dialog-yes"
              />
            )}
          </Flex>
        )}
        {props.footer}
      </Flex>
    </ReactModal>
  );
}

export default BaseDialog;

function DialogButton(props: DialogButtonProps) {
  return (
    <Button
      {...props}
      variant="primary"
      sx={{
        opacity: props.disabled ? 0.7 : 1,
        fontWeight: "bold",
        bg: "transparent",

        ":hover": { bg: "bgSecondary" }
      }}
      disabled={props.disabled}
      onClick={props.disabled ? undefined : props.onClick}
    >
      {props.loading ? <Icon.Loading size={16} color="primary" /> : props.text}
    </Button>
  );
}

function onAfterOpen(
  e: ReactModal.OnAfterOpenCallbackOptions | undefined,
  props: DialogProps
) {
  if (!props.onClose || !e) return;
  // we need this work around because ReactModal content spreads over the overlay
  const child = e.contentEl.firstElementChild as HTMLElement;
  if (!child) return;

  e.contentEl.onmousedown = function (e) {
    if (!e.screenX && !e.screenY) return;
    if (
      e.x < child.offsetLeft ||
      e.x > child.offsetLeft + child.clientWidth ||
      e.y < child.offsetTop ||
      e.y > child.offsetTop + child.clientHeight
    ) {
      if (props.onClose) props.onClose();
    }
  };
  if (props.onOpen) props.onOpen();
}
