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

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import DelayLayout from "../../components/delay-layout";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import useNavigationStore from "../../stores/use-navigation-store";
import { tabBarRef } from "../../utils/global-refs";
import { components } from "./components";
import { SectionItem } from "./section-item";
import { RouteParams, SettingSection } from "./types";
const keyExtractor = (item: SettingSection) => item.id;

const Group = ({
  navigation,
  route
}: NativeStackScreenProps<RouteParams, "SettingsGroup">) => {
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current?.lock();
      useNavigationStore.getState().update(
        {
          name: "SettingsGroup",
          title: route.params.name as string
        },
        true
      );
      return false;
    }
  });
  useEffect(() => {
    return () => {
      tabBarRef.current?.unlock();
    };
  }, []);
  const renderItem = ({ item }: { item: SettingSection; index: number }) => (
    <SectionItem item={item} />
  );

  return (
    <DelayLayout type="settings" delay={300}>
      <View
        style={{
          flex: 1
        }}
      >
        {route.params.sections ? (
          <Animated.FlatList
            entering={FadeInDown}
            exiting={FadeOutDown}
            data={route.params.sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        ) : null}
        {route.params.component ? components[route.params.component] : null}
      </View>
    </DelayLayout>
  );
};

export default Group;
