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

import {
  formatReminderTime,
  getUpcomingReminder
} from "@notesnook/core/collections/reminders";
import { decode, EntityLevel } from "entities";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { TaggedNotes } from "../../../screens/notes/tagged";
import { TopicNotes } from "../../../screens/notes/topic-notes";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { COLORS_NOTE } from "../../../utils/color-scheme";
import { SIZE } from "../../../utils/size";
import { Properties } from "../../properties";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { TimeSince } from "../../ui/time-since";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const navigateToTopic = (topic) => {
  TopicNotes.navigate(topic, true);
};

function navigateToTag(item) {
  const tag = db.tags.tag(item.id);
  if (!tag) return;
  TaggedNotes.navigate(tag, true);
}

const showActionSheet = (item) => {
  Properties.present(item);
};

function getNotebook(item) {
  const isTrash = item.type === "trash";
  if (isTrash || !item.notebooks || item.notebooks.length < 1) return [];

  return item.notebooks.reduce(function (prev, curr) {
    if (prev && prev.length > 0) return prev;
    const topicId = curr.topics[0];
    const notebook = db.notebooks?.notebook(curr.id)?.data;
    if (!notebook) return [];
    const topic = notebook.topics.find((t) => t.id === topicId);
    if (!topic) return [];

    return [
      {
        title: `${notebook?.title} › ${topic?.title}`,
        notebook: notebook,
        topic: topic
      }
    ];
  }, []);
}

const NoteItem = ({
  item,
  isTrash,
  tags,
  dateBy = "dateCreated",
  noOpen = false
}) => {
  const colors = useThemeStore((state) => state.colors);
  const notesListMode = useSettingStore(
    (state) => state.settings.notesListMode
  );
  const compactMode = notesListMode === "compact";
  const attachmentCount = db.attachments?.ofNote(item.id, "all")?.length || 0;
  const notebooks = React.useMemo(() => getNotebook(item), [item]);
  const reminders = db.relations.from(item, "reminder");
  const current = getUpcomingReminder(reminders);
  const _update = useRelationStore((state) => state.updater);

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}
      >
        {!compactMode ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              zIndex: 10,
              elevation: 10,
              marginBottom: 2.5
            }}
          >
            {notebooks?.map((_item) => (
              <Button
                title={_item.title}
                key={_item}
                height={20}
                icon="book-outline"
                type="grayBg"
                fontSize={SIZE.xs}
                iconSize={SIZE.sm}
                textStyle={{
                  marginRight: 0
                }}
                style={{
                  borderRadius: 5,
                  marginRight: 5,
                  borderWidth: 0.5,
                  borderColor: colors.icon,
                  paddingHorizontal: 6
                }}
                onPress={() => navigateToTopic(_item.topic)}
              />
            ))}
          </View>
        ) : null}

        <Heading
          numberOfLines={1}
          color={COLORS_NOTE[item.color?.toLowerCase()] || colors.heading}
          style={{
            flexWrap: "wrap"
          }}
          size={SIZE.md}
        >
          {item.title}
        </Heading>

        {item.headline && !compactMode ? (
          <Paragraph
            style={{
              flexWrap: "wrap"
            }}
            numberOfLines={2}
          >
            {decode(item.headline, {
              level: EntityLevel.HTML
            })}
          </Paragraph>
        ) : null}

        {current &&
        current.date &&
        (current.mode !== "once" || current.date > Date.now()) ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              Properties.present(current);
            }}
            style={{
              backgroundColor: colors.nav,
              borderRadius: 5,
              flexDirection: "row",
              paddingHorizontal: 5,
              paddingVertical: 3,
              alignItems: "center",
              marginTop: 5,
              justifyContent: "flex-start",
              alignSelf: "flex-start"
            }}
          >
            <>
              <Icon name="clock-outline" size={SIZE.md} color={colors.accent} />
              <Paragraph
                size={SIZE.xs + 1}
                color={colors.icon}
                style={{ marginLeft: 5 }}
              >
                {formatReminderTime(current)}
              </Paragraph>
            </>
          </TouchableOpacity>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
            marginTop: 5,
            height: SIZE.md + 2
          }}
        >
          {!isTrash ? (
            <>
              {item.conflicted ? (
                <Icon
                  name="alert-circle"
                  style={{
                    marginRight: 6
                  }}
                  size={SIZE.sm}
                  color={colors.red}
                />
              ) : null}
              <TimeSince
                style={{
                  fontSize: SIZE.xs,
                  color: colors.icon,
                  marginRight: 6
                }}
                time={item[dateBy]}
                updateFrequency={
                  Date.now() - item[dateBy] < 60000 ? 2000 : 60000
                }
              />

              {attachmentCount > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 6
                  }}
                >
                  <Icon name="attachment" size={SIZE.md} color={colors.icon} />
                  <Paragraph color={colors.icon} size={SIZE.xs}>
                    {attachmentCount}
                  </Paragraph>
                </View>
              ) : null}

              {item.pinned ? (
                <Icon
                  testID="icon-pinned"
                  name="pin-outline"
                  size={SIZE.sm}
                  style={{
                    marginRight: 6
                  }}
                  color={
                    COLORS_NOTE[item.color?.toLowerCase()] || colors.accent
                  }
                />
              ) : null}

              {item.locked ? (
                <Icon
                  name="lock"
                  testID="note-locked-icon"
                  size={SIZE.sm}
                  style={{
                    marginRight: 6
                  }}
                  color={colors.icon}
                />
              ) : null}

              {item.favorite ? (
                <Icon
                  testID="icon-star"
                  name="star"
                  size={SIZE.md}
                  style={{
                    marginRight: 6
                  }}
                  color="orange"
                />
              ) : null}

              {!isTrash && !compactMode && tags
                ? tags.map((item) =>
                    item.id ? (
                      <Button
                        title={"#" + item.alias}
                        key={item.id}
                        height={23}
                        type="gray"
                        textStyle={{
                          textDecorationLine: "underline"
                        }}
                        hitSlop={{ top: 8, bottom: 12, left: 0, right: 0 }}
                        fontSize={SIZE.xs}
                        style={{
                          borderRadius: 5,
                          paddingHorizontal: 6,
                          marginRight: 4,
                          zIndex: 10,
                          maxWidth: tags.length > 1 ? 130 : null
                        }}
                        onPress={() => navigateToTag(item)}
                      />
                    ) : null
                  )
                : null}
            </>
          ) : (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 6
                }}
              >
                Deleted on{" "}
                {item && item.dateDeleted
                  ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                  : null}
              </Paragraph>

              <Paragraph
                color={colors.accent}
                size={SIZE.xs}
                style={{
                  marginRight: 6
                }}
              >
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
            </>
          )}
        </View>
      </View>
      <IconButton
        testID={notesnook.listitem.menu}
        color={colors.pri}
        name="dots-horizontal"
        size={SIZE.xl}
        onPress={() => !noOpen && showActionSheet(item, isTrash)}
        customStyle={{
          justifyContent: "center",
          height: 35,
          width: 35,
          borderRadius: 100,
          alignItems: "center"
        }}
      />
    </>
  );
};

export default NoteItem;
