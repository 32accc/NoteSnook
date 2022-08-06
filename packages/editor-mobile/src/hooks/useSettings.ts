import { getDefaultPresets } from "@streetwriters/editor";
import { useState } from "react";

const settingsJson = localStorage.getItem("editorSettings");
const initialState = {
  fullscreen: false,
  deviceMode: "mobile",
  premium: false,
  tools: JSON.parse(JSON.stringify(getDefaultPresets().default)),
  noToolbar: global.noToolbar,
  noHeader: global.noHeader,
  readonly: global.readonly,
  doubleSpacedLines: true,
};

global.settingsController = {
  update: (settings) => {
    const nextSettings = {
      ...settings,
      noToolbar: global.noToolbar || settings.noToolbar,
      noHeader: global.noHeader || settings.noHeader,
      readonly: global.readonly || settings.readonly,
    };
    if (
      JSON.stringify(nextSettings) ===
      JSON.stringify(global.settingsController.previous)
    ) {
      return;
    }
    if (global.settingsController.set)
      global.settingsController.set(nextSettings);
    if (settings) {
      localStorage.setItem("editorSettings", JSON.stringify(nextSettings));
    } else {
      localStorage.removeItem("editorSettings");
    }
    settingsController.previous = { ...nextSettings };
  },
  previous: settingsJson ? JSON.parse(settingsJson) : { ...initialState },
};

export const useSettings = () => {
  const [settings, setSettings] = useState({
    ...global.settingsController.previous,
  });
  global.settingsController.set = setSettings;

  return settings;
};
