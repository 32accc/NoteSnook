const { addPluginToPluginManager } = require("../utils");

function register(editor) {
  setupUI(editor);

  editor.addCommand("mceAttachImage", function (image) {
    insertImage(editor, image);
  });

  editor.addCommand("mceAttachFile", function (file) {
    insertFile(editor, file);
  });

  editor.addCommand("mceReplaceImage", function (image) {
    const { hash, src } = image;
    const elements = editor.dom.doc.querySelectorAll(
      `img[data-hash="${hash}"]`
    );
    if (!elements || !elements.length || !src) return;
    for (let element of elements) {
      element.setAttribute("src", src);
    }
  });

  /**
   * NOTE: we have to extend the editor interface directly
   * because calling execCommand forces the editor to steal
   * the focus. There is currently no way around that.
   */
  editor._updateAttachmentProgress = function (progressState) {
    const { hash, total, loaded } = progressState;
    const elements = editor.dom.doc.querySelectorAll(
      `span.attachment[data-hash="${hash}"]`
    );
    if (!elements || !elements.length || !total || !loaded) return;
    for (let element of elements) {
      if (total === loaded) {
        element.removeAttribute("data-progress");
        element.style.removeProperty("--progress");
      } else {
        const percent = Math.round((loaded / total) * 100);
        element.setAttribute("data-progress", `${percent}%`);
        element.style.setProperty("--progress", `${percent}%`);
      }
    }
  };
}

function setupUI(editor) {
  editor.ui.registry.addIcon(
    "download",
    `<svg height="24" width="24"><path d="M13,5V11H14.17L12,13.17L9.83,11H11V5H13M15,3H9V9H5L12,16L19,9H15V3M19,18H5V20H19V18Z" /></svg>`
  );

  editor.ui.registry.addButton("download", {
    icon: "download",
    tooltip: "Download attachment",
    onAction: () => {
      const node = editor.selection.getNode();
      if (!node || !editor.settings.attachmenthandler_download_attachment)
        return;
      const hash = node.getAttribute("data-hash");
      editor.settings.attachmenthandler_download_attachment(hash);
    },
  });

  editor.ui.registry.addButton("delete", {
    icon: "close",
    tooltip: "Remove attachment",
    onAction: () => {
      editor.execCommand("Delete");
    },
  });

  editor.ui.registry.addContextToolbar("attachment-selection", {
    predicate: function (node) {
      return node.nodeName !== "IMG" && node.classList.contains("attachment");
    },
    items: "download delete",
    position: "node",
  });
}

async function insertImage(editor, image) {
  var content = `
    <img class="attachment"
        alt="${image.filename || image.hash}"
        data-mime="${image.type}"
        data-hash="${image.hash}"
        data-filename="${image.filename}"
        src="${image.dataurl}"
        data-size="${image.size}"
        style="float: left;"/>
    `;
  editor.insertContent(content);
  editor.execCommand("mceInsertNewLine");
}

async function insertFile(editor, file) {
  var content = `
      <span
          class="attachment"
          contenteditable="false"
          title="${file.filename}"
          data-mime="${file.type}"
          data-filename="${file.filename}"
          data-hash="${file.hash}"
          data-size="${formatBytes(file.size, 1)}">
          <em>&nbsp;</em>
          ${file.filename}
      </span>`;
  editor.insertContent(content);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

(function init() {
  addPluginToPluginManager("attachmentshandler", register);
})();
