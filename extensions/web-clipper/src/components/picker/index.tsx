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
import { PropsWithChildren } from "react";
import Modal from "react-modal";
import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "../theme-provider";
Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    boxShadow: "0px 1px 10px var(--info)",
    border: "none",
    borderRadius: 5,
    backgroundColor: "var(--background)",
    padding: "10px",

    height: "80vh",
    width: "85vw",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  } as const
};

type PickerProps = {
  isOpen: boolean;
  onClose: () => void;
};
export const Picker = (props: PropsWithChildren<PickerProps>) => {
  const { children, isOpen, onClose } = props;

  return (
    <Modal
      style={{
        content: customStyles.content,
        overlay: {
          backgroundColor: "var(--overlay)"
        }
      }}
      onRequestClose={onClose}
      isOpen={isOpen}
    >
      <ThemeProvider>
        <Flex
          sx={{
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {children}
        </Flex>
      </ThemeProvider>
    </Modal>
  );
};
