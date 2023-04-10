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

import React, { RefObject, useEffect, useRef, useState } from "react";
import { getTotalWords, Editor } from "@notesnook/editor";

function StatusBar({ container }: { container: RefObject<HTMLDivElement> }) {
  const [status, setStatus] = useState({
    date: "",
    saved: ""
  });
  const [sticky, setSticky] = useState(false);
  const stickyRef = useRef(false);
  const prevScroll = useRef(0);
  const lastStickyChangeTime = useRef(0);
  const [words, setWords] = useState("0 words");
  const currentWords = useRef(words);
  const statusBar = useRef({
    set: setStatus,
    updateWords: () => {
      const words = getTotalWords(editor as Editor) + " words";
      if (currentWords.current === words) return;
      setWords(words);
    }
  });
  globalThis.statusBar = statusBar;

  const onScroll = React.useCallback((event) => {
    const currentOffset = event.target.scrollTop;
    if (currentOffset < 200) {
      if (stickyRef.current) {
        stickyRef.current = false;
        setSticky(false);
        lastStickyChangeTime.current = Date.now();
        prevScroll.current = currentOffset;
      }
      return;
    }
    if (Date.now() - lastStickyChangeTime.current < 300) return;
    if (currentOffset > prevScroll.current) {
      setSticky(false);
      stickyRef.current = false;
    } else {
      setSticky(true);
      stickyRef.current = true;
    }
    lastStickyChangeTime.current = Date.now();
    prevScroll.current = currentOffset;
  }, []);

  useEffect(() => {
    currentWords.current = words;
  }, [words]);

  useEffect(() => {
    const node = container.current;
    node?.addEventListener("scroll", onScroll);
    return () => {
      node?.removeEventListener("scroll", onScroll);
    };
  }, [onScroll, container]);

  const paragraphStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "12px",
    color: "var(--nn_icon)",
    marginRight: 8,
    paddingBottom: 0,
    userSelect: "none",
    pointerEvents: "none"
  };

  return (
    <div
      style={{
        flexDirection: "row",
        display: "flex",
        paddingRight: 12,
        paddingLeft: 12,
        position: sticky ? "sticky" : "relative",
        top: -3,
        backgroundColor: "var(--nn_bg)",
        zIndex: 1,
        justifyContent: sticky ? "center" : "flex-start",
        paddingTop: 2,
        paddingBottom: 2
      }}
      id="statusbar"
    >
      <p style={paragraphStyle}>{words}</p>
      <p style={paragraphStyle}>{status.date}</p>
      <p style={paragraphStyle}>{status.saved}</p>
    </div>
  );
}

export default React.memo(StatusBar, () => true);
