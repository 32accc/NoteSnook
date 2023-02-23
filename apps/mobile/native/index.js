/* eslint-disable @typescript-eslint/no-var-requires */
import './globals.js';
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry, LogBox, Platform, UIManager } from 'react-native';
import Config from 'react-native-config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import appJson from './app.json';
import Notifications from "../app/services/notifications";
Notifications.init();

const appName = appJson.name;
if (Config.isTesting) {
  Date.prototype.toLocaleString = () => 'XX-XX-XX';
}
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

if (__DEV__) {
  console.warn = () => null;
  LogBox.ignoreAllLogs();
}
let NotesnookShare;

let QuickNoteIOS;

const AppProvider = () => {
  const App = require('../app/app.js').default;
  return <App />;
};

AppRegistry.registerComponent(appName, () => AppProvider);

const ShareProvider = () => {
  NotesnookShare = require('../share/index').default;
  return Platform.OS === 'ios' ? (
    <SafeAreaProvider>
      <NotesnookShare quicknote={false} />
    </SafeAreaProvider>
  ) : (
    <NotesnookShare quicknote={false} />
  );
};

AppRegistry.registerComponent('NotesnookShare', () => ShareProvider);

const QuickNoteProvider = () => {
  QuickNoteIOS = require('../share/quick-note').default;
  return (
    <SafeAreaProvider>
      <QuickNoteIOS />
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent('QuickNoteIOS', () => QuickNoteProvider);
