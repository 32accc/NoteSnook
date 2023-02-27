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
import { LICENSES } from "./license-data";
import { FlatList, Linking } from "react-native";
import { PressableButton } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import { SIZE } from "../../utils/size";
import { useThemeStore } from "../../stores/use-theme-store";
import Paragraph from "../../components/ui/typography/paragraph";

type LicenseEntry = {
  name: string;
  licenseType: string;
  author: string;
  link: string;
};

export const Licenses = () => {
  const colors = useThemeStore((state) => state.colors);
  const renderItem = React.useCallback(
    ({ item }: { item: LicenseEntry }) => (
      <PressableButton
        key={item.name}
        customStyle={{
          alignItems: "flex-start",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          borderRadius: 0
        }}
        onPress={() => {
          Linking.openURL(item.link).catch(console.log);
        }}
      >
        <Heading size={SIZE.sm}>{item.name}</Heading>
        <Paragraph>
          {item.licenseType} | {item.author?.split("<")[0]}
        </Paragraph>
      </PressableButton>
    ),
    [colors.nav]
  );
  return (
    <FlatList
      data={LICENSES}
      style={{
        width: "100%"
      }}
      renderItem={renderItem}
    />
  );
};
