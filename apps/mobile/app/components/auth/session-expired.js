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

import React, { useEffect, useState } from "react";
import { Modal, View } from "react-native";
import { db } from "../../common/database";
import BiometricService from "../../services/biometrics";
import {
  ToastEvent,
  eSendEvent,
  eSubscribeEvent
} from "../../services/event-manager";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { eLoginSessionExpired, eUserLoggedIn } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Dialog } from "../dialog";
import { presentDialog } from "../dialog/functions";
import SheetProvider from "../sheet-provider";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { LoginSteps, useLogin } from "./use-login";

function getObfuscatedEmail(email) {
  if (!email) return "";
  const [username, provider] = email.split("@");
  if (username.length === 1) return `****@${provider}`;
  return email.replace(/(.{1})(.*)(?=@)/, function (gp1, gp2, gp3) {
    for (let i = 0; i < gp3.length; i++) {
      gp2 += "*";
    }
    return gp2;
  });
}

export const SessionExpired = () => {
  const colors = useThemeStore((state) => state.colors);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { step, password, email, passwordInputRef, loading, login } = useLogin(
    () => {
      eSendEvent(eUserLoggedIn, true);
      setVisible(false);
    }
  );

  const logout = async () => {
    try {
      await db.user.logout();
      await BiometricService.resetCredentials();
      SettingsService.set({
        introCompleted: true
      });
      setVisible(false);
    } catch (e) {
      ToastEvent.show({
        heading: e.message,
        type: "error",
        context: "local"
      });
    }
  };

  useEffect(() => {
    const sub = eSubscribeEvent(eLoginSessionExpired, open);
    return () => {
      sub.unsubscribe?.();
      setFocused(false);
    };
  }, [visible, open]);

  const open = React.useCallback(async () => {
    try {
      let res = await db.user.tokenManager.getToken();
      if (!res) throw new Error("no token found");
      if (db.user.tokenManager._isTokenExpired(res))
        throw new Error("token expired");
      Sync.run("global", false, true, async (complete) => {
        if (!complete) {
          let user = await db.user.getUser();
          if (!user) return;
          email.current = user.email;
          setVisible(true);
          return;
        }
        SettingsService.set({
          sessionExpired: false
        });
        setVisible(false);
      });
    } catch (e) {
      console.log(e);
      let user = await db.user.getUser();
      if (!user) return;
      email.current = user.email;
      setVisible(true);
    }
  }, [email]);

  return (
    visible && (
      <Modal
        onShow={async () => {
          await sleep(300);
          passwordInputRef.current?.focus();
          setFocused(true);
        }}
        visible={true}
      >
        <SheetProvider context="two_factor_verify" />
        <View
          style={{
            width: focused ? "100%" : "99.9%",
            padding: 12,
            justifyContent: "center",
            flex: 1,
            backgroundColor: colors.bg
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginBottom: 20,
              borderRadius: 10,
              paddingVertical: 20
            }}
          >
            <IconButton
              customStyle={{
                width: 60,
                height: 60
              }}
              name="alert"
              color={colors.errorText}
              size={50}
            />
            <Heading size={SIZE.xxxl} color={colors.heading}>
              Session expired
            </Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
            >
              Your session on this device has expired. Please enter password for{" "}
              {getObfuscatedEmail(email.current)} to continue.
            </Paragraph>
          </View>

          {step === LoginSteps.passwordAuth ? (
            <Input
              fwdRef={passwordInputRef}
              onChangeText={(value) => {
                password.current = value;
              }}
              returnKeyLabel="Next"
              returnKeyType="next"
              secureTextEntry
              autoComplete="password"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Password"
              onSubmit={() => login()}
            />
          ) : null}

          <Button
            style={{
              marginTop: 10,
              width: 250,
              borderRadius: 100
            }}
            loading={loading}
            onPress={() => login()}
            type="accent"
            title={loading ? null : "Login"}
          />

          <Button
            style={{
              marginTop: 10,
              width: "100%"
            }}
            onPress={() => {
              presentDialog({
                context: "session_expiry",
                title: "Logout",
                paragraph:
                  "Are you sure you want to logout from this device? Any unsynced changes will be lost.",
                positiveText: "Logout",
                positiveType: "errorShade",
                positivePress: logout
              });
            }}
            type="errorShade"
            title={loading ? null : "Logout from this device"}
          />
        </View>
        <Toast context="local" />
        <Dialog context="session_expiry" />
      </Modal>
    )
  );
};
