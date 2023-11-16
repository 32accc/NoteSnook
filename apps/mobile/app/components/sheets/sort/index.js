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

import React, { useState } from "react";
import { View } from "react-native";
import { db } from "../../../common/database";
import { eSendEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useThemeColors } from "@notesnook/theme";
import { GROUP, SORT } from "../../../utils/constants";
import { refreshNotesPage } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
const Sort = ({ type, screen }) => {
  const isTopicSheet = screen === "TopicSheet";
  const { colors } = useThemeColors();
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(screen === "Notes" ? "home" : type + "s")
  );
  const updateGroupOptions = async (_groupOptions) => {
    await db.settings.setGroupOptions(type, _groupOptions);

    setGroupOptions(_groupOptions);
    setTimeout(() => {
      if (screen !== "TopicSheet") Navigation.queueRoutesForUpdate(screen);
      eSendEvent("groupOptionsUpdate");
      eSendEvent(refreshNotesPage);
    }, 1);
  };

  const setOrderBy = async () => {
    let _groupOptions = {
      ...groupOptions,
      sortDirection: groupOptions.sortDirection === "asc" ? "desc" : "asc"
    };
    if (type === "topics") {
      _groupOptions.groupBy = "none";
    }
    await updateGroupOptions(_groupOptions);
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        justifyContent: "space-between"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12
        }}
      >
        <Heading
          size={SIZE.xl}
          style={{
            alignSelf: "center"
          }}
        >
          Sort by
        </Heading>

        <Button
          title={
            groupOptions.sortDirection === "asc"
              ? groupOptions.groupBy === "abc" ||
                groupOptions.sortBy === "title"
                ? "A - Z"
                : "Old - New"
              : groupOptions.groupBy === "abc" ||
                groupOptions.sortBy === "title"
              ? "Z - A"
              : "New - Old"
          }
          icon={
            groupOptions.sortDirection === "asc"
              ? "sort-ascending"
              : "sort-descending"
          }
          height={25}
          iconPosition="right"
          fontSize={SIZE.sm - 1}
          type="transparent"
          buttonType={{
            text: colors.primary.accent
          }}
          style={{
            borderRadius: 100,
            paddingHorizontal: 6
          }}
          onPress={setOrderBy}
        />
      </View>

      <Seperator />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          flexWrap: "wrap",
          borderBottomWidth: isTopicSheet ? 0 : 1,
          borderBottomColor: colors.secondary.background,
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingBottom: 12,
          alignItems: "center"
        }}
      >
        {groupOptions.groupBy === "abc" ? (
          <Button
            type={"grayBg"}
            title="Title"
            height={40}
            iconPosition="left"
            icon={"check"}
            buttonType={{ text: colors.primary.accent }}
            fontSize={SIZE.sm}
            iconSize={SIZE.md}
          />
        ) : (
          Object.keys(SORT).map((item) =>
            (item === "title" && groupOptions.groupBy !== "none") ||
            ((screen !== "Tags" || screen !== "Reminders") &&
              item === "dateModified") ||
            ((screen === "Tags" || screen === "Reminders") &&
              item === "dateEdited") ? null : (
              <Button
                key={item}
                type={groupOptions.sortBy === item ? "selected" : "gray"}
                title={SORT[item]}
                height={40}
                iconPosition="left"
                icon={groupOptions.sortBy === item ? "check" : null}
                style={{
                  marginRight: 10,
                  paddingHorizontal: 8
                }}
                buttonType={{
                  text:
                    groupOptions.sortBy === item
                      ? colors.primary.accent
                      : colors.secondary.paragraph
                }}
                fontSize={SIZE.sm}
                onPress={async () => {
                  let _groupOptions = {
                    ...groupOptions,
                    sortBy: type === "trash" ? "dateDeleted" : item
                  };
                  if (type === "topics") {
                    _groupOptions.groupBy = "none";
                  }
                  await updateGroupOptions(_groupOptions);
                }}
                iconSize={SIZE.md}
              />
            )
          )
        )}
      </View>

      {isTopicSheet ? null : (
        <>
          <Heading
            style={{
              marginLeft: 12
            }}
            size={SIZE.lg}
          >
            Group by
          </Heading>

          <Seperator />

          <View
            style={{
              borderRadius: 0,
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 12
            }}
          >
            {Object.keys(GROUP).map((item) => (
              <Button
                key={item}
                testID={"btn-" + item}
                type={
                  groupOptions.groupBy === GROUP[item] ? "selected" : "gray"
                }
                buttonType={{
                  text:
                    groupOptions.groupBy === GROUP[item]
                      ? colors.primary.accent
                      : colors.secondary.paragraph
                }}
                onPress={async () => {
                  let _groupOptions = {
                    ...groupOptions,
                    groupBy: GROUP[item]
                  };

                  if (item === "abc") {
                    _groupOptions.sortBy = "title";
                    _groupOptions.sortDirection = "asc";
                  } else {
                    if (groupOptions.sortBy === "title") {
                      _groupOptions.sortBy = "dateEdited";
                      _groupOptions.sortDirection = "desc";
                    }
                  }
                  updateGroupOptions(_groupOptions);
                }}
                height={40}
                icon={groupOptions.groupBy === GROUP[item] ? "check" : null}
                title={
                  item.slice(0, 1).toUpperCase() + item.slice(1, item.length)
                }
                style={{
                  paddingHorizontal: 8,
                  marginBottom: 10,
                  marginRight: 10
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default Sort;
