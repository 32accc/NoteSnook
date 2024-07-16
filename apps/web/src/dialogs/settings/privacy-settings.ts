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

import { SettingsGroup } from "./types";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { getPlatform } from "../../utils/platform";
import { db } from "../../common/db";
import Config from "../../utils/config";
import { showToast } from "../../utils/toast";
import { TrackingDetails } from "./components/tracking-details";
import { PromptDialog } from "../prompt";

export const PrivacySettings: SettingsGroup[] = [
  {
    key: "general",
    section: "privacy",
    header: "General",
    settings: [
      {
        key: "telemetry",
        title: "Telemetry",
        description: `Usage data & crash reports will be sent to us (no 3rd party involved) for analytics. All data is anonymous as mentioned in our privacy policy.

What data is collected & when?`,
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.telemetry, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => !!useSettingStore.getState().telemetry,
            toggle: () => useSettingStore.getState().toggleTelemetry()
          },
          {
            type: "custom",
            component: TrackingDetails
          }
        ]
      },
      {
        key: "marketing",
        title: "Marketing emails",
        description:
          "We send you occasional promotional offers & product updates on your email (once every month).",
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.marketingConsent, listener),
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "toggle",
            isToggled: () => !!useUserStore.getState().user?.marketingConsent,
            toggle: async () => {
              await db.user.changeMarketingConsent(
                !useUserStore.getState().user?.marketingConsent
              );
              await useUserStore.getState().refreshUser();
            }
          }
        ]
      },
      {
        key: "hide-note-title",
        title: "Hide note title",
        description: "Prevent note title from appearing in tab/window title.",
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.hideNoteTitle, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().hideNoteTitle,
            toggle: () => useSettingStore.getState().toggleHideTitle()
          }
        ]
      },
      {
        key: "privacy-mode",
        title: "Privacy mode",
        description:
          "Prevent Notesnook app from being captured by any screen capturing software like TeamViewer & AnyDesk.",
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.privacyMode, listener),
        isHidden: () => !IS_DESKTOP_APP || getPlatform() === "linux",
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().privacyMode,
            toggle: () => useSettingStore.getState().togglePrivacyMode()
          }
        ]
      }
    ]
  },
  {
    key: "advanced",
    section: "privacy",
    header: "Advanced",
    settings: [
      {
        key: "custom-dns",
        title: "Use custom DNS",
        description: `Notesnook uses the following DNS providers:

1. Cloudflare DNS
2. Quad9

This can sometimes bypass local ISP blockages on Notesnook traffic. Disable this if you want the app to use system's DNS settings.`,
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.customDns, listener),
        isHidden: () => !IS_DESKTOP_APP,
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().customDns,
            toggle: () => useSettingStore.getState().toggleCustomDns()
          }
        ]
      },
      {
        key: "custom-cors",
        title: "Custom CORS proxy",
        description:
          "CORS proxy is required to directly download images from within the Notesnook app. It allows Notesnook to bypass browser restrictions by using a proxy. You can set a custom self-hosted proxy URL to increase your privacy.",
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.telemetry, listener),
        components: [
          {
            type: "button",
            title: "Change proxy",
            action: async () => {
              const result = await PromptDialog.show({
                title: "CORS bypass proxy",
                description:
                  "You can set a custom proxy URL to increase your privacy.",
                defaultValue: Config.get(
                  "corsProxy",
                  "https://cors.notesnook.com"
                )
              });
              if (!result) return;
              try {
                const url = new URL(result);
                Config.set("corsProxy", `${url.protocol}//${url.hostname}`);
              } catch (e) {
                console.error(e);
                showToast("error", "Invalid CORS proxy url.");
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "proxy-config",
        title: "Proxy",
        description: `Setup an HTTP/HTTPS/SOCKS proxy.
        
For example:
http://foobar:80
socks4://proxy.example.com
http://username:password@foobar:80

To remove the proxy, simply erase everything in the input.`,
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.proxyRules, listener),
        components: [
          {
            type: "input",
            inputType: "text",
            defaultValue: () => useSettingStore.getState().proxyRules || "",
            onChange: (value) => {
              useSettingStore.getState().setProxyRules(value);
            }
          }
        ]
      }
    ]
  }
];
