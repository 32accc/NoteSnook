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

import { Button, Text } from "@theme-ui/components";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";

type CheckListItemProps = {
  title: string;
  isSelected: boolean;
  onSelected: () => void;
  indentLevel?: number;
};

export function CheckListItem(props: CheckListItemProps) {
  const { title, onSelected, isSelected, indentLevel = 0 } = props;
  return (
    <Button
      onClick={onSelected}
      sx={{
        display: "flex",
        alignItems: "center",
        py: 1,
        px: 1,
        ml: indentLevel * 2,

        color: "paragraph",
        bg: "transparent",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        borderRadius: 0,
        ":hover:not(:disabled)": {
          borderBottomColor: "accent"
        }
      }}
    >
      <Icon
        path={isSelected ? Icons.checkCircle : Icons.circle}
        color={isSelected ? "accent" : "paragraph"}
        size={16}
      />
      <Text
        sx={{
          fontSize: "13px",
          ml: 1,
          fontWeight: 400,
          color: "paragraph",
          textAlign: "left"
        }}
      >
        {title}
      </Text>
    </Button>
  );
}
