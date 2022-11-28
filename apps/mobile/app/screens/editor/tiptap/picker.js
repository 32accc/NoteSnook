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

import React from "react";
import { Platform, View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import Sodium from "@ammarahmed/react-native-sodium";
import RNFetchBlob from "rn-fetch-blob";
import { db } from "../../../common/database";
import { AttachmentItem } from "../../../components/attachments/attachment-item";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../../services/event-manager";
import PremiumService from "../../../services/premium";
import { eCloseProgressDialog } from "../../../utils/events";
import { sleep } from "../../../utils/time";
import { editorController, editorState } from "./utils";
const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

const showEncryptionSheet = (file) => {
  presentSheet({
    title: "Encrypting attachment",
    paragraph: "Please wait while we encrypt file for upload",
    icon: "attachment",
    component: (
      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <AttachmentItem
          attachment={{
            metadata: {
              filename: file.name
            },
            length: file.size
          }}
          encryption
        />
      </View>
    )
  });
};

const santizeUri = (uri) => {
  uri = decodeURI(uri);
  uri = Platform.OS === "ios" ? uri.replace("file:///", "/") : uri;
  return uri;
};

const file = async (fileOptions) => {
  try {
    const options = {
      mode: "import",
      allowMultiSelection: false
    };
    if (Platform.OS == "ios") {
      options.copyTo = "cachesDirectory";
    }
    await db.attachments.generateKey();

    let file;
    try {
      file = await DocumentPicker.pick(options);
    } catch (e) {
      return;
    }

    file = file[0];
    if (file.type.startsWith("image")) {
      ToastEvent.show({
        title: "Type not supported",
        message: "Please add images from gallery or camera picker.",
        type: "error"
      });
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      ToastEvent.show({
        title: "File too large",
        message: "The maximum allowed size per file is 500 MB",
        type: "error"
      });
      return;
    }

    if (file.copyError) {
      ToastEvent.show({
        heading: "Failed to open file",
        message: file.copyError,
        type: "error",
        context: "global"
      });
      return;
    }

    let uri = Platform.OS === "ios" ? file.fileCopyUri : file.uri;
    console.log("file uri: ", uri);
    uri = Platform.OS === "ios" ? santizeUri(uri) : uri;
    showEncryptionSheet(file);
    const hash = await Sodium.hashFile({
      uri: uri,
      type: "url"
    });
    if (!(await attachFile(uri, hash, file.type, file.name, fileOptions)))
      return;
    editorController.current?.commands.insertAttachment({
      hash: hash,
      filename: file.name,
      type: file.type,
      size: file.size
    });
    setTimeout(() => {
      eSendEvent(eCloseProgressDialog);
    }, 1000);
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: "You need internet access to attach a file",
      type: "error",
      context: "global"
    });
    console.log("attachment error: ", e);
  }
};

const camera = async (options) => {
  try {
    await db.attachments.generateKey();
    eSendEvent(eCloseProgressDialog);
    await sleep(400);
    launchCamera(
      {
        includeBase64: true,
        mediaType: "photo"
      },
      (response) => handleImageResponse(response, options)
    );
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: "You need internet access to attach a file",
      type: "error",
      context: "global"
    });
    console.log("attachment error:", e);
  }
};

const gallery = async (options) => {
  try {
    await db.attachments.generateKey();
    eSendEvent(eCloseProgressDialog);
    await sleep(400);
    launchImageLibrary(
      {
        includeBase64: true,
        mediaType: "photo",
        selectionLimit: 1
      },
      (response) => handleImageResponse(response, options)
    );
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: "You need internet access to attach a file",
      type: "error",
      context: "global"
    });
    console.log("attachment error:", e);
  }
};

const pick = async (options) => {
  if (!PremiumService.get()) {
    let user = await db.user.getUser();
    if (editorState().isFocused) {
      editorState().isFocused = true;
    }
    if (user && !PremiumService.get() && !user?.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
    } else {
      PremiumService.sheet();
    }
    return;
  }
  if (options?.type.startsWith("image") || options?.type === "camera") {
    if (options.type === "image") {
      gallery(options);
    } else {
      camera(options);
    }
  } else {
    file(options);
  }
};

const handleImageResponse = async (response, options) => {
  if (
    response.didCancel ||
    response.errorMessage ||
    !response.assets ||
    response.assets?.length === 0
  ) {
    return;
  }

  let image = response.assets[0];
  if (image.fileSize > IMAGE_SIZE_LIMIT) {
    ToastEvent.show({
      title: "File too large",
      message: "The maximum allowed size per image is 50 MB",
      type: "error"
    });
    return;
  }
  const b64 = `data:${image.type};base64, ` + image.base64;
  const uri = decodeURI(image.uri);
  const hash = await Sodium.hashFile({
    uri: uri,
    type: "url"
  });

  let fileName = image.originalFileName || image.fileName;
  if (!(await attachFile(uri, hash, image.type, fileName, options))) return;

  editorController.current?.commands.insertImage({
    hash: hash,
    type: image.type,
    title: fileName,
    src: b64,
    size: image.fileSize,
    filename: fileName
  });
};

async function attachFile(uri, hash, type, filename, options) {
  try {
    let exists = db.attachments.exists(hash);
    let encryptionInfo;

    if (options?.hash && options.hash !== hash) {
      ToastEvent.show({
        heading: "Please select the same file for reuploading",
        message: `Expected hash ${options.hash} but got ${hash}.`,
        type: "error",
        context: "local"
      });
      return false;
    }

    if (!exists || options?.reupload) {
      let key = await db.attachments.generateKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: "url",
        hash: hash
      });
      encryptionInfo.type = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = "xcha-stream";
      encryptionInfo.size = encryptionInfo.length;
      encryptionInfo.key = key;
      if (options?.reupload && exists) await db.attachments.reset(hash);
    } else {
      encryptionInfo = { hash: hash };
    }
    await db.attachments.add(
      encryptionInfo,
      editorController.current?.note?.id
    );
    if (Platform.OS === "ios") await RNFetchBlob.fs.unlink(uri);

    return true;
  } catch (e) {
    console.log("attach file error: ", e);
    if (Platform.OS === "ios") {
      await RNFetchBlob.fs.unlink(uri);
    }
    return false;
  }
}

export default {
  file,
  pick
};
