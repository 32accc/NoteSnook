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

import React, { useEffect } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View
} from "react-native";
import Editor from ".";
import { PremiumToast } from "../../components/premium/premium-toast";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import useKeyboard from "../../hooks/use-keyboard";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { editorRef } from "../../utils/global-refs";
import { ProgressBar } from "./progress";
import { editorController, editorState, textInput } from "./tiptap/utils";
export const EditorWrapper = ({ width }) => {
  const colors = useThemeStore((state) => state.colors);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const loading = false;
  const insets = useGlobalSafeAreaInsets();
  const floating = useIsFloatingKeyboard();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const keyboard = useKeyboard();

  const onAppStateChanged = async (state) => {
    if (editorState().movedAway) return;
    if (state === "active") {
      editorController.current.onReady();
      editorController.current.overlay(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    let sub = AppState.addEventListener("change", onAppStateChanged);
    return () => {
      sub?.remove();
    };
  }, [loading]);

  const getMarginBottom = () => {
    const bottomInsets = Platform.OS === "android" ? 12 : insets.bottom || 14;
    if (!keyboard.keyboardShown) return bottomInsets / 1.5;
    if (Platform.isPad && !floating) return bottomInsets;
    if (Platform.OS === "ios") return bottomInsets / 1.5;
    return 0;
  };

  const KeyboardAvoidingViewIOS =
    Platform.OS === "ios" ? KeyboardAvoidingView : View;

  return (
    <View
      testID="editor-wrapper"
      ref={editorRef}
      style={{
        width: width[!introCompleted ? "mobile" : deviceMode]?.c,
        height: "100%",
        minHeight: "100%",
        backgroundColor: colors.bg,
        borderLeftWidth: DDS.isTab ? 1 : 0,
        borderLeftColor: DDS.isTab ? colors.nav : "transparent"
      }}
    >
      {loading || !introCompleted ? null : (
        <KeyboardAvoidingViewIOS
          behavior="padding"
          style={{
            marginBottom: getMarginBottom(),
            flex: 1
          }}
          enabled={!floating}
          keyboardVerticalOffset={0}
        >
          <PremiumToast key="toast" context="editor" offset={50 + insets.top} />
          <TextInput
            key="input"
            ref={textInput}
            style={{ height: 1, padding: 0, width: 1, position: "absolute" }}
            blurOnSubmit={false}
          />
          <ProgressBar />
          <Editor key="editor" withController={true} />
        </KeyboardAvoidingViewIOS>
      )}
    </View>
  );
};
