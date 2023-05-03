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
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { getElevation } from "../../utils";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const Intro = ({ navigation }) => {
  const colors = useThemeStore((state) => state.colors);
  const isTelemetryEnabled = useSettingStore(
    (state) => state.settings.telemetry
  );
  const { width } = useWindowDimensions();
  const insets = useGlobalSafeAreaInsets();
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current.lock();
    }
  });

  const renderItem = React.useCallback(
    ({ item }) => (
      <View
        style={{
          justifyContent: "center",
          width: width,
          paddingHorizontal: width * 0.05
        }}
      >
        <View
          style={{
            flexDirection: "row"
          }}
        >
          <View
            style={{
              width: 100,
              height: 5,
              backgroundColor: colors.accent,
              borderRadius: 2,
              marginRight: 7
            }}
          />

          <View
            style={{
              width: 20,
              height: 5,
              backgroundColor: colors.nav,
              borderRadius: 2
            }}
          />
        </View>
        <View
          style={{
            marginTop: 10,
            marginBottom: 20,
            maxWidth: "90%",
            width: "100%"
          }}
        >
          {item.headings.map((heading) => (
            <Heading
              key={heading}
              style={{
                fontFamily: "OpenSans-Bold",
                marginBottom: 5
              }}
              size={SIZE.xxl}
            >
              {heading}
            </Heading>
          ))}

          <Paragraph size={SIZE.sm}>{item.body}</Paragraph>
        </View>
      </View>
    ),
    [colors.accent, colors.nav, width]
  );

  return (
    <View
      testID="notesnook.splashscreen"
      style={{
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginTop: insets.top,
        paddingVertical: "10%"
      }}
    >
      <View
        style={{
          flex: 0.7,
          //   backgroundColor: colors.nav,
          width: "100%"
          // borderRadius: 20,
          // borderWidth: 1,
          // borderColor: colors.border
        }}
      >
        <SwiperFlatList
          autoplay
          autoplayDelay={3}
          autoplayLoop
          index={0}
          useReactNativeGestureHandler={true}
          showPagination
          data={[
            {
              headings: ["Open source.", "End to end encrypted.", "Private."],
              body: "Write notes with freedom, no spying, no tracking."
            }
          ]}
          paginationActiveColor={colors.accent}
          paginationStyleItem={{
            width: 10,
            height: 5
          }}
          paginationDefaultColor={colors.border}
          renderItem={renderItem}
        />
      </View>

      <View
        style={{
          width: "100%",
          flex: 0.3,
          justifyContent: "center"
        }}
      >
        <Button
          width={250}
          onPress={async () => {
            navigation.navigate("AppLock", {
              welcome: true
            });
          }}
          style={{
            paddingHorizontal: 24,
            alignSelf: "center",
            ...getElevation(5)
          }}
          type="accent"
          title="Get started"
        />

        <TouchableOpacity
          activeOpacity={1}
          style={{
            flexDirection: "row",
            alignSelf: "center",
            width: "90%",
            marginBottom: 12,
            paddingHorizontal: 12,
            justifyContent: "center",
            padding: 12,
            maxWidth: 500
          }}
          onPress={() => {
            SettingsService.set({ telemetry: !isTelemetryEnabled });
          }}
        >
          <Icon
            size={SIZE.md}
            name={
              isTelemetryEnabled ? "checkbox-marked" : "checkbox-blank-outline"
            }
            color={isTelemetryEnabled ? colors.accent : colors.icon}
          />

          <Paragraph
            style={{
              flexShrink: 1,
              marginLeft: 6
            }}
            size={SIZE.xs}
          >
            Help improve Notesnook by sending completely anonymized{" "}
            <Heading size={SIZE.xs}>private analytics and bug reports.</Heading>
          </Paragraph>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Intro;

/**
 * 1. Welcome Screen
 * 2. Select privacy mode
 * 3. Ask to Sign up
 * 4. Sign up
 * 5. Home Screen
 */
