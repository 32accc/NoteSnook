/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import 'react-native-url-polyfill/auto';
import "./polyfills/console-time.js"
global.Buffer = require('buffer').Buffer;
import '../app/common/logger/index';
import { DOMParser } from './worker.js';
global.DOMParser = DOMParser;
