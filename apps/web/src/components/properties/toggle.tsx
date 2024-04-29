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

import { Flex, Switch, Text } from "@theme-ui/components";
import { Icon } from "../icons";

type ToggleProps = {
  icon: Icon;
  label: string;
  onToggle: (toggleState: boolean) => void;
  isOn: boolean;
  testId?: string;
};
function Toggle(props: ToggleProps) {
  const { icon: ToggleIcon, label, onToggle, isOn } = props;

  return (
    <Flex
      py={2}
      px={1}
      sx={{
        borderBottom: "1px solid var(--separator)",
        cursor: "pointer",
        alignItems: "center",
        justifyContent: "space-between",

        "& label": { width: "auto", flexShrink: 0 }
      }}
      data-test-id={props.testId}
      onClick={() => onToggle(!isOn)}
    >
      <Text
        variant="body"
        sx={{ alignItems: "center", color: "paragraph", display: "flex" }}
        data-test-id={`toggle-state-${isOn ? "on" : "off"}`}
      >
        <ToggleIcon size={13} sx={{ flexShrink: 0, mr: 1 }} />
        {label}
      </Text>
      <Switch
        sx={{ m: 0, bg: isOn ? "accent" : "icon-secondary" }}
        checked={isOn}
        onClick={(e) => e.stopPropagation()}
      />
    </Flex>
  );
}
export default Toggle;
