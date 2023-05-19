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

import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { presentSheet } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";
import DownloadAttachments from "./download-attachments";
import { Button } from "../ui/button";

const documentMimeTypes = ["application/pdf"];

export const AttachmentDialog = ({ note }) => {
  const colors = useThemeStore((state) => state.colors);

  const [attachments, setAttachments] = useState(
    note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])]
  );

  const attachmentSearchValue = useRef();
  const searchTimer = useRef();
  const [loading, setLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("all");

  const onChangeText = (text) => {
    const attachments = note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])];

    attachmentSearchValue.current = text;
    if (
      !attachmentSearchValue.current ||
      attachmentSearchValue.current === ""
    ) {
      setAttachments([...attachments]);
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      let results = db.lookup.attachments(
        attachments,
        attachmentSearchValue.current
      );
      if (results.length === 0) return;
      setAttachments(results);
    }, 300);
  };

  const renderItem = ({ item }) => (
    <AttachmentItem setAttachments={setAttachments} attachment={item} />
  );

  const onCheck = async () => {
    setLoading(true);
    const checkedAttachments = [];
    for (let attachment of attachments) {
      let result = await filesystem.checkAttachment(attachment.metadata.hash);
      if (result.failed) {
        await db.attachments.markAsFailed(
          attachment.metadata.hash,
          result.failed
        );
      } else {
        await db.attachments.markAsFailed(attachment.id, null);
      }
      checkedAttachments.push(
        db.attachments.attachment(attachment.metadata.hash)
      );
      setAttachments([...checkedAttachments]);
    }
    setLoading(false);
  };

  const attachmentTypes = [
    {
      title: "All",
      filterBy: "all"
    },
    {
      title: "Images",
      filterBy: "images"
    },
    {
      title: "Documents",
      filterBy: "documents"
    },
    {
      title: "Video",
      filterBy: "video"
    },
    {
      title: "Audio",
      filterBy: "audio"
    }
  ];

  const filterAttachments = (type) => {
    const attachments = note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])];

    switch (type) {
      case "all":
        return attachments;
      case "images":
        return attachments.filter((attachment) =>
          attachment.metadata.type.startsWith("image/")
        );
      case "video":
        return attachments.filter((attachment) =>
          attachment.metadata.type.startsWith("video/")
        );
      case "audio":
        return attachments.filter((attachment) =>
          attachment.metadata.type.startsWith("audio/")
        );
      case "documents":
        return attachments.filter(
          (attachment) =>
            documentMimeTypes.indexOf(attachment.metadata.type) > -1
        );
    }
  };

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12
      }}
    >
      <SheetProvider context="attachments-list" />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading>Attachments</Heading>

        <View
          style={{
            flexDirection: "row"
          }}
        >
          {loading ? (
            <ActivityIndicator
              style={{
                height: 40,
                width: 40,
                marginRight: 10
              }}
              size={SIZE.lg}
            />
          ) : (
            <IconButton
              name="check-all"
              customStyle={{
                height: 40,
                width: 40,
                marginRight: 10
              }}
              color={colors.pri}
              size={SIZE.lg}
              onPress={onCheck}
            />
          )}

          <IconButton
            name="download"
            customStyle={{
              height: 40,
              width: 40
            }}
            color={colors.pri}
            onPress={() => {
              DownloadAttachments.present(
                "attachments-list",
                attachments,
                !!note
              );
            }}
            size={SIZE.lg}
          />
        </View>
      </View>

      <Seperator />
      <Input
        placeholder="Filter attachments by filename, type or hash"
        onChangeText={onChangeText}
        onSubmit={() => {
          onChangeText(attachmentSearchValue.current);
        }}
      />

      <FlatList
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        ListHeaderComponent={
          <ScrollView
            style={{
              width: "100%",
              height: 50,
              flexDirection: "row"
            }}
            contentContainerStyle={{
              minWidth: "100%"
            }}
            horizontal
          >
            {attachmentTypes.map((item) => (
              <Button
                type={currentFilter === item.filterBy ? "grayAccent" : "gray"}
                key={item.title}
                title={
                  item.title +
                  ` (${filterAttachments(item.filterBy)?.length || 0})`
                }
                style={{
                  borderRadius: 0,
                  borderBottomWidth: 1,
                  flexGrow: 1,
                  borderBottomColor:
                    currentFilter !== item.filterBy
                      ? "transparent"
                      : colors.accent
                }}
                onPress={() => {
                  setCurrentFilter(item.filterBy);
                  setAttachments(filterAttachments(item.filterBy));
                }}
              />
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          <View
            style={{
              height: 150,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon name="attachment" size={60} color={colors.icon} />
            <Paragraph>
              {note ? "No attachments on this note" : "No attachments"}
            </Paragraph>
          </View>
        }
        ListFooterComponent={
          <View
            style={{
              height: 350
            }}
          />
        }
        data={attachments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <Paragraph
        color={colors.icon}
        size={SIZE.xs}
        style={{
          textAlign: "center",
          marginTop: 10
        }}
      >
        <Icon name="shield-key-outline" size={SIZE.xs} color={colors.icon} />
        {"  "}All attachments are end-to-end encrypted.
      </Paragraph>
    </View>
  );
};

AttachmentDialog.present = (note) => {
  presentSheet({
    component: () => <AttachmentDialog note={note} />
  });
};
