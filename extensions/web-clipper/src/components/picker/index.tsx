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
import { PropsWithChildren } from "react";
import Modal from "react-modal";
import { Button, Flex } from "@theme-ui/components";
import { EmotionThemeProvider, useThemeEngineStore } from "@notesnook/theme";

Modal.setAppElement("#root");

type PickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
};
export const Picker = (props: PropsWithChildren<PickerProps>) => {
  const { children, isOpen, onClose, onDone } = props;
  const theme = useThemeEngineStore((store) => store.theme);

  return (
    <Modal
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          boxShadow: `0px 0px 25px 5px ${
            theme.colorScheme === "dark" ? "#000000aa" : "#0000004e"
          }`,
          border: "none",
          borderRadius: 5,
          backgroundColor: theme.scopes.base.primary.background,
          padding: "0px",

          height: "80vh",
          width: "85vw",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        },
        overlay: {
          backgroundColor: theme.scopes.base.primary.backdrop
        }
      }}
      onRequestClose={onClose}
      isOpen={isOpen}
    >
      <EmotionThemeProvider
        scope="dialog"
        injectCssVars
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            overflow: "hidden",
            height: "100%"
          }}
        >
          <Flex
            sx={{
              flexDirection: "column",
              overflow: "hidden",
              flex: 1,
              padding: 2
            }}
          >
            {children}
          </Flex>
          <Flex
            sx={{
              bg: "background-secondary",
              p: 1,
              justifyContent: "end"
            }}
          >
            <Button variant="dialog" onClick={onDone}>
              Done
            </Button>
          </Flex>
        </Flex>
      </EmotionThemeProvider>
    </Modal>
  );
};
