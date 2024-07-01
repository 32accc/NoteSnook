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

import { Debug } from "@notesnook/core/dist/api/debug";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { Linking, Platform, Text, TextInput, View } from "react-native";
import { getVersion } from "react-native-device-info";
import { useStoredRef } from "../../../hooks/use-stored-ref";
import { ToastManager, eSendEvent } from "../../../services/event-manager";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSheet } from "../../../utils/events";
import { openLinkInBrowser } from "../../../utils/functions";
import { SIZE } from "../../../utils/size";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const Issue = ({ defaultTitle, defaultBody, issueTitle }) => {
  const { colors } = useThemeColors();
  const body = useStoredRef("issueBody");
  const title = useStoredRef("issueTitle", defaultTitle);
  const [done, setDone] = useState(false);
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef();
  const initialLayout = useRef(false);
  const issueUrl = useRef();

  const onPress = async () => {
    if (loading) return;
    if (!title.current || !body.current) return;
    if (title.current?.trim() === "" || body.current?.trim().length === 0)
      return;

    try {
      setLoading(true);
      issueUrl.current = await Debug.report({
        title: title.current,
        body:
          body.current +
          `\n${defaultBody}` +
          `\n_______________
**Device information:**
App version: ${getVersion()}
Platform: ${Platform.OS}
Model: ${Platform.constants.Brand || ""}-${Platform.constants.Model || ""}-${
            Platform.constants.Version || ""
          }
Pro: ${PremiumService.get()}
Logged in: ${user ? "yes" : "no"}`,
        userId: user?.id
      });
      setLoading(false);
      eSendEvent(eCloseSheet);
      body.reset();
      title.reset();
      setDone(true);
    } catch (e) {
      setLoading(false);
      ToastManager.show({
        heading: "An error occured",
        message: e.message,
        type: "error"
      });
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 12,
        width: "100%"
      }}
    >
      {done ? (
        <>
          <View
            style={{
              height: 250,
              justifyContent: "center",
              alignItems: "center",
              gap: 10
            }}
          >
            <Heading>Issue submitted</Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
              selectable={true}
            >
              You can track your issue at{" "}
              <Paragraph
                style={{
                  textDecorationLine: "underline",
                  color: colors.primary.accent
                }}
                onPress={() => {
                  Linking.openURL(issueUrl.current);
                }}
              >
                {issueUrl.current}
              </Paragraph>
              . Please note that we will respond to your issue on the given
              link. We recommend that you save it.
            </Paragraph>

            <Button
              title="Open issue"
              onPress={() => {
                Linking.openURL(issueUrl.current);
              }}
              type="accent"
              width="100%"
            />
          </View>
        </>
      ) : (
        <>
          <DialogHeader
            title={issueTitle || "Report issue"}
            paragraph={
              issueTitle
                ? "We are sorry, it seems that the app crashed due to an error. You can submit a bug report below so we can fix this asap."
                : "Let us know if you have faced any issue/bug while using Notesnook."
            }
          />

          <Seperator half />

          <TextInput
            placeholder="Title"
            onChangeText={(v) => (title.current = v)}
            defaultValue={title.current}
            style={{
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: 5,
              padding: 12,
              fontFamily: "OpenSans-Regular",
              marginBottom: 10,
              fontSize: SIZE.md,
              color: colors.primary.heading
            }}
            placeholderTextColor={colors.primary.placeholder}
          />

          <TextInput
            ref={bodyRef}
            multiline
            placeholder={`Tell us more about the issue you are facing. 

For example:
- What were you trying to do in the app?
- What did you expect to happen?
- Steps to reproduce the issue 
- Things you have tried etc.`}
            numberOfLines={5}
            textAlignVertical="top"
            onChangeText={(v) => (body.current = v)}
            onLayout={() => {
              if (initialLayout.current) return;
              initialLayout.current = true;
              if (body.current) {
                bodyRef.current?.setNativeProps({
                  text: body.current,
                  selection: {
                    start: 0,
                    end: 0
                  }
                });
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: 5,
              padding: 12,
              fontFamily: "OpenSans-Regular",
              maxHeight: 200,
              fontSize: SIZE.sm,
              marginBottom: 2.5,
              color: colors.primary.paragraph
            }}
            placeholderTextColor={colors.primary.placeholder}
          />
          <Paragraph
            size={SIZE.xs}
            color={colors.secondary.paragraph}
          >{`App version: ${getVersion()} Platform: ${Platform.OS} Model: ${
            Platform.constants.Brand
          }-${Platform.constants.Model}-${
            Platform.constants.Version
          }`}</Paragraph>

          <Seperator />
          <Button
            onPress={onPress}
            title={loading ? null : "Submit"}
            loading={loading}
            width="100%"
            type="accent"
          />

          <Paragraph
            color={colors.secondary.paragraph}
            size={SIZE.xs}
            style={{
              marginTop: 10,
              textAlign: "center"
            }}
          >
            The information above will be publically available at{" "}
            <Text
              onPress={() => {
                Linking.openURL("https://github.com/streetwriters/notesnook");
              }}
              style={{
                textDecorationLine: "underline",
                color: colors.primary.accent
              }}
            >
              github.com/streetwriters/notesnook.
            </Text>{" "}
            If you want to ask something in general or need some assistance, we
            would suggest that you{" "}
            <Text
              style={{
                textDecorationLine: "underline",
                color: colors.primary.accent
              }}
              onPress={async () => {
                try {
                  await openLinkInBrowser(
                    "https://discord.gg/zQBK97EE22",
                    colors
                  );
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              join our community on Discord.
            </Text>
          </Paragraph>
        </>
      )}
    </View>
  );
};
