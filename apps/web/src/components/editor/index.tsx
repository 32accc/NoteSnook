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

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  PropsWithChildren,
  Suspense
} from "react";
import ReactDOM from "react-dom";
import { Box, Button, Flex, Progress, Text } from "@theme-ui/components";
import Properties from "../properties";
import { useStore, store as editorstore } from "../../stores/editor-store";
import {
  useStore as useAppStore,
  store as appstore
} from "../../stores/app-store";
import Toolbar from "./toolbar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import Tiptap from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { useEditorInstance } from "./context";
import { attachFile, AttachmentProgress, insertAttachment } from "./picker";
import { saveAttachment, downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "@notesnook/core/common";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import Titlebox from "./title-box";
import useTablet from "../../hooks/use-tablet";
import Config from "../../utils/config";
import { AnimatedFlex } from "../animated";
import { EditorLoader } from "../loaders/editor-loader";
import { Lightbox } from "../lightbox";
import ThemeProviderWrapper from "../theme-provider";
import { Allotment } from "allotment";
// import { PdfPreview } from "";
import { showToast } from "../../utils/toast";
import { getFormattedDate } from "../../utils/time";

const PDFPreview = React.lazy(() => import("../pdf-preview"));

type PreviewSession = {
  content: { data: string; type: string };
  dateCreated: number;
  dateEdited: number;
};

type DocumentPreview = {
  url?: string;
  hash: string;
};

function onEditorChange(noteId: string, sessionId: number, content: string) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, {
    type: "tiptap",
    data: content
  });
}

export default function EditorManager({
  noteId,
  nonce
}: {
  noteId: string | number;
  nonce?: string;
}) {
  const isNewSession = !!nonce && noteId === 0;
  const isOldSession = !nonce && !!noteId;

  // the only state that changes. Everything else is
  // stored in refs. Update this value to trigger an
  // update.
  const [timestamp, setTimestamp] = useState<number>(0);

  const lastSavedTime = useRef<number>(0);
  const [docPreview, setDocPreview] = useState<DocumentPreview>();

  const previewSession = useRef<PreviewSession>();
  const [dropRef, overlayRef] = useDragOverlay();
  const editorInstance = useEditorInstance();

  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isReadonly = useStore((store) => store.session.readonly);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isPreviewSession = !!previewSession.current;

  const isMobile = useMobile();
  const isTablet = useTablet();

  useEffect(() => {
    const event = db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      async (item?: Record<string, string | number>) => {
        if (
          !item ||
          lastSavedTime.current >= (item.dateEdited as number) ||
          isPreviewSession ||
          !appstore.get().isRealtimeSyncEnabled
        )
          return;

        const { id, contentId, locked } = editorstore.get().session;
        const isContent = item.type === "tiptap" && item.id === contentId;
        const isNote = item.type === "note" && item.id === id;

        if (isContent && editorInstance.current) {
          if (locked) {
            const result = await db.vault?.decryptContent(item).catch(() => {});
            if (result) item.data = result.data;
            else EV.publish(EVENTS.vaultLocked);
          }
          const oldHashes = editorInstance.current.getMediaHashes();

          editorInstance.current.updateContent(item.data as string);

          const newHashes = editorInstance.current.getMediaHashes();
          const hashesToLoad = newHashes.filter(
            (hash, index) => hash !== oldHashes[index]
          );

          if (appstore.get().isSyncing()) {
            db.eventManager.subscribe(
              EVENTS.syncCompleted,
              async () => {
                await db.attachments?.downloadMedia(id, hashesToLoad);
              },
              true
            );
          } else {
            await db.attachments?.downloadMedia(id, hashesToLoad);
          }
        } else if (isNote) {
          if (!locked && item.locked) return EV.publish(EVENTS.vaultLocked);

          editorstore.get().updateSession(item);
        }
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [editorInstance, isPreviewSession]);

  const openSession = useCallback(async (noteId: string | number) => {
    await editorstore.get().openSession(noteId);
    previewSession.current = undefined;

    lastSavedTime.current = Date.now();
    setTimestamp(Date.now());
  }, []);

  const loadMedia = useCallback(async () => {
    if (previewSession.current) {
      await db.content?.downloadMedia(
        noteId,
        previewSession.current.content,
        true
      );
    } else if (noteId && editorstore.get().session.content) {
      await db.attachments?.downloadMedia(noteId);
    }
  }, [noteId]);

  useEffect(() => {
    if (!isNewSession) return;

    (async function () {
      await editorstore.newSession(nonce);

      lastSavedTime.current = 0;
      setTimestamp(Date.now());
    })();
  }, [isNewSession, nonce]);

  useEffect(() => {
    if (!isOldSession) return;

    openSession(noteId);
  }, [noteId]);

  return (
    <Allotment
      proportionalLayout={true}
      onDragEnd={(sizes) => {
        Config.set("editor:panesize", sizes[1]);
      }}
    >
      <Allotment.Pane className="editor-pane">
        <Flex
          ref={dropRef}
          id="editorContainer"
          sx={{
            position: "relative",
            alignSelf: "stretch",
            overflow: "hidden",
            flex: 1,
            flexDirection: "column"
          }}
        >
          {previewSession.current && (
            <PreviewModeNotice
              {...previewSession.current}
              onDiscard={() => openSession(noteId)}
            />
          )}
          <Editor
            nonce={timestamp}
            content={() =>
              previewSession.current?.content?.data ||
              editorstore.get().session?.content?.data
            }
            onPreviewDocument={(url) => setDocPreview(url)}
            onContentChange={() => (lastSavedTime.current = Date.now())}
            options={{
              readonly: isReadonly || isPreviewSession,
              onRequestFocus: () => toggleProperties(false),
              onLoadMedia: loadMedia,
              focusMode: isFocusMode,
              isMobile: isMobile || isTablet
            }}
          />

          {arePropertiesVisible && (
            <Properties
              onOpenPreviewSession={async (session: PreviewSession) => {
                previewSession.current = session;
                setTimestamp(Date.now());
              }}
            />
          )}
          <DropZone overlayRef={overlayRef} />
        </Flex>
      </Allotment.Pane>
      {docPreview && (
        <Allotment.Pane
          minSize={450}
          preferredSize={Config.get("editor:panesize", 500)}
        >
          {docPreview.url ? (
            <Flex
              id="editorSidebar"
              sx={{
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: "1px solid var(--border)",
                height: "100%"
              }}
            >
              <Suspense
                fallback={<DownloadAttachmentProgress hash={docPreview.hash} />}
              >
                <PDFPreview
                  fileUrl={docPreview.url}
                  hash={docPreview.hash}
                  onClose={() => setDocPreview(undefined)}
                />
              </Suspense>
            </Flex>
          ) : (
            <DownloadAttachmentProgress hash={docPreview.hash} />
          )}
        </Allotment.Pane>
      )}
    </Allotment>
  );
}

type DownloadAttachmentProgressProps = {
  hash: string;
};
function DownloadAttachmentProgress(props: DownloadAttachmentProgressProps) {
  const { hash } = props;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: AttachmentProgress) => {
        if (progress.hash === hash) {
          setProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      }
    );

    return () => {
      event.unsubscribe();
    };
  }, [hash]);

  return (
    <Flex
      sx={{
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}
    >
      <Text variant="title">Downloading attachment ({progress}%)</Text>
      <Progress
        value={progress}
        max={100}
        sx={{ width: ["90%", "35%"], mt: 1 }}
      />
    </Flex>
  );
}

type EditorOptions = {
  isMobile?: boolean;
  headless?: boolean;
  readonly?: boolean;
  focusMode?: boolean;
  onRequestFocus?: () => void;
  onLoadMedia?: () => void;
};
type EditorProps = {
  content: () => string | undefined;
  nonce?: number;
  options?: EditorOptions;
  onContentChange?: () => void;
  onPreviewDocument?: (preview: DocumentPreview) => void;
};
export function Editor(props: EditorProps) {
  const { content, nonce, options, onContentChange, onPreviewDocument } = props;
  const { readonly, headless, onLoadMedia, isMobile } = options || {
    headless: false,
    readonly: false,
    focusMode: false,
    isMobile: false
  };
  const [isLoading, setIsLoading] = useState(true);

  const editor = useEditorInstance();

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total, type }: AttachmentProgress) => {
        editor.current?.sendAttachmentProgress(
          hash,
          type,
          Math.round((loaded / total) * 100)
        );
      }
    );

    const mediaAttachmentDownloadedEvent = EV.subscribe(
      EVENTS.mediaAttachmentDownloaded,
      ({
        groupId,
        hash,
        attachmentType,
        src
      }: {
        groupId?: string;
        attachmentType: "image" | "webclip" | "generic";
        hash: string;
        src: string;
      }) => {
        if (groupId?.startsWith("monograph")) return;
        if (attachmentType === "image") {
          editor.current?.loadImage(hash, src);
        } else if (attachmentType === "webclip") {
          editor.current?.loadWebClip(hash, src);
        }
      }
    );

    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, [editor]);

  return (
    <EditorChrome isLoading={isLoading} {...props}>
      <Tiptap
        isMobile={isMobile}
        nonce={nonce}
        readonly={readonly}
        toolbarContainerId={headless ? undefined : "editorToolbar"}
        content={content}
        downloadOptions={{
          corsHost: Config.get("corsProxy", "https://cors.notesnook.com")
        }}
        onLoad={() => {
          if (onLoadMedia) onLoadMedia();
          if (nonce && nonce > 0) setIsLoading(false);
        }}
        onContentChange={onContentChange}
        onChange={onEditorChange}
        onDownloadAttachment={(attachment) => saveAttachment(attachment.hash)}
        onPreviewAttachment={async ({ hash, dataurl }) => {
          const attachment = db.attachments?.attachment(hash);
          if (attachment && attachment.metadata.type.startsWith("image/")) {
            const container = document.getElementById("dialogContainer");
            if (!(container instanceof HTMLElement)) return;

            dataurl = dataurl || (await downloadAttachment(hash, "base64"));
            if (!dataurl)
              return showToast("error", "This image cannot be previewed.");

            ReactDOM.render(
              <ThemeProviderWrapper>
                <Lightbox
                  image={dataurl}
                  onClose={() => {
                    ReactDOM.unmountComponentAtNode(container);
                  }}
                />
              </ThemeProviderWrapper>,
              container
            );
          } else if (attachment && onPreviewDocument) {
            onPreviewDocument({ hash });
            const blob = await downloadAttachment(hash, "blob");
            if (!blob) return;
            onPreviewDocument({ url: URL.createObjectURL(blob), hash });
          }
        }}
        onInsertAttachment={(type) => {
          const mime = type === "file" ? "*/*" : "image/*";
          insertAttachment(mime).then((file) => {
            if (!file) return;
            editor.current?.attachFile(file);
          });
        }}
        onAttachFile={async (file) => {
          const result = await attachFile(file);
          if (!result) return;
          editor.current?.attachFile(result);
        }}
      />
    </EditorChrome>
  );
}

function EditorChrome(
  props: PropsWithChildren<EditorProps & { isLoading: boolean }>
) {
  const { options, children, isLoading } = props;
  const { readonly, focusMode, headless, onRequestFocus, isMobile } =
    options || {
      headless: false,
      readonly: false,
      focusMode: false,
      isMobile: false
    };
  const editorMargins = useStore((store) => store.editorMargins);

  if (headless) return <>{children}</>;

  return (
    <>
      {isLoading ? (
        <AnimatedFlex
          sx={{
            position: "absolute",
            overflow: "hidden",
            flex: 1,
            flexDirection: "column",
            width: "100%",
            height: "100%",
            zIndex: 999,
            bg: "background"
          }}
        >
          <EditorLoader />
        </AnimatedFlex>
      ) : null}

      <Toolbar />
      <FlexScrollContainer
        className="editorScroll"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        <Flex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", focusMode ? "center" : "stretch", "center"],
            maxWidth: editorMargins ? "min(100%, 850px)" : "auto",
            width: "100%"
          }}
          px={6}
          onClick={onRequestFocus}
        >
          {!isMobile && (
            <Box
              id="editorToolbar"
              sx={{
                display: readonly ? "none" : "flex",
                bg: "background",
                position: "sticky",
                top: 0,
                mb: 1,
                zIndex: 2
              }}
            />
          )}
          <Titlebox readonly={readonly || false} />
          <Header readonly={readonly} />
          <AnimatedFlex
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </AnimatedFlex>
        </Flex>
      </FlexScrollContainer>
      {isMobile && (
        <Box
          id="editorToolbar"
          sx={{
            display: readonly ? "none" : "flex",
            bg: "background",
            position: "sticky",
            top: 0,
            mb: 1,
            zIndex: 2,
            px: [2, 2, 35]
          }}
        />
      )}
    </>
  );
}

type PreviewModeNoticeProps = PreviewSession & {
  onDiscard: () => void;
};
function PreviewModeNotice(props: PreviewModeNoticeProps) {
  const { dateCreated, dateEdited, content, onDiscard } = props;
  const disablePreviewMode = useCallback(
    async (cancelled: boolean) => {
      const { id, sessionId } = editorstore.get().session;
      if (!cancelled) {
        await editorstore.saveSessionContent(id, sessionId, content);
      }
      onDiscard();
    },
    [onDiscard, content]
  );

  return (
    <Flex
      bg="bgSecondary"
      p={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
      data-test-id="preview-notice"
    >
      <Flex mr={4} sx={{ flexDirection: "column" }}>
        <Text variant={"subtitle"}>Preview</Text>
        <Text variant={"body"}>
          You are previewing note version edited from{" "}
          {getFormattedDate(dateCreated)} to {getFormattedDate(dateEdited)}.
        </Text>
      </Flex>
      <Flex>
        <Button
          data-test-id="preview-notice-cancel"
          variant={"secondary"}
          mr={1}
          px={4}
          onClick={() => disablePreviewMode(true)}
        >
          Cancel
        </Button>
        <Button
          data-test-id="preview-notice-restore"
          px={4}
          onClick={async () => {
            await disablePreviewMode(false);
          }}
        >
          Restore
        </Button>
      </Flex>
    </Flex>
  );
}

type DropZoneProps = {
  overlayRef: React.MutableRefObject<HTMLElement | undefined>;
};
function DropZone(props: DropZoneProps) {
  const { overlayRef } = props;
  const editor = useEditorInstance();

  return (
    <Box
      ref={overlayRef}
      id="drag-overlay"
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        bg: "overlay",
        zIndex: 3,
        alignItems: "center",
        justifyContent: "center",
        display: "none"
      }}
      onDrop={async (e) => {
        if (!editor || !e.dataTransfer.files?.length) return;
        e.preventDefault();

        for (const file of e.dataTransfer.files) {
          const result = await attachFile(file);
          if (!result) continue;
          editor.current?.attachFile(result);
        }
      }}
    >
      <Flex
        sx={{
          border: "2px dashed var(--fontTertiary)",
          borderRadius: "default",
          p: 70,
          flexDirection: "column",
          pointerEvents: "none"
        }}
      >
        <Attachment size={72} />
        <Text variant={"heading"} sx={{ color: "icon", mt: 2 }}>
          Drop your files here to attach
        </Text>
      </Flex>
    </Box>
  );
}

function useDragOverlay() {
  const dropElementRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLElement>();

  useEffect(() => {
    const dropElement = dropElementRef.current;
    const overlay = overlayRef.current;

    if (!dropElement || !overlay) return;

    function showOverlay(e: DragEvent) {
      if (!overlay || !isFile(e)) return;

      overlay.style.display = "flex";
    }

    function hideOverlay() {
      if (!overlay) return;
      overlay.style.display = "none";
    }

    function allowDrag(e: DragEvent) {
      if (!e.dataTransfer || !isFile(e)) return;

      e.dataTransfer.dropEffect = "copy";
      e.preventDefault();
    }

    dropElement.addEventListener("dragenter", showOverlay);
    overlay.addEventListener("drop", hideOverlay);
    overlay.addEventListener("dragenter", allowDrag);
    overlay.addEventListener("dragover", allowDrag);
    overlay.addEventListener("dragleave", hideOverlay);
    return () => {
      dropElement.removeEventListener("dragenter", showOverlay);
      overlay.removeEventListener("drop", hideOverlay);
      overlay.removeEventListener("dragenter", allowDrag);
      overlay.removeEventListener("dragover", allowDrag);
      overlay.removeEventListener("dragleave", hideOverlay);
    };
  }, []);

  return [dropElementRef, overlayRef] as const;
}

function isFile(e: DragEvent) {
  return (
    e.dataTransfer &&
    (e.dataTransfer.files?.length > 0 ||
      e.dataTransfer.types?.some((a) => a === "Files"))
  );
}
