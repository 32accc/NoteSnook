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
import { View } from "react-native";
import { db } from "../../common/database";
import { TaggedNotes } from "../../screens/notes/tagged";
import { eSendEvent } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { eOpenTagsDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
export const Tags = ({ item, close }) => {
  const colors = useThemeStore((state) => state.colors);

  return item.id ? (
    <View
      style={{
        marginTop: 5,
        marginBottom: 5
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <Button
          onPress={async () => {
            close();
            await sleep(300);
            eSendEvent(eOpenTagsDialog, item);
          }}
          buttonType={{
            text: colors.accent
          }}
          title="Add tags"
          type="grayBg"
          icon="plus"
          iconPosition="right"
          height={25}
          fontSize={SIZE.xs + 1}
          style={{
            marginRight: 5,
            borderRadius: 100,
            paddingHorizontal: 8
          }}
        />
        {item.tags.map((item) =>
          item ? <TagItem key={item} tag={item} close={close} /> : null
        )}
      </View>
    </View>
  ) : null;
};

const TagItem = ({ tag, close }) => {
  const onPress = async () => {
    let tags = db.tags.all;
    let _tag = tags.find((t) => t.title === tag);
    TaggedNotes.navigate(_tag, true);
    await sleep(300);
    close();
  };

  const style = {
    paddingHorizontal: 8,
    marginVertical: 5,
    borderRadius: 100,
    marginRight: 5
  };

  return (
    <Button
      onPress={onPress}
      title={"#" + tag}
      // buttonType={{
      //   text: colors.accent
      // }}
      type="grayBg"
      height={25}
      fontSize={SIZE.xs + 1}
      style={style}
    />
  );
};
