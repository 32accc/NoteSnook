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
import { useStore, store } from "../stores/note-store";
import ListContainer from "../components/list-container";
import { db } from "../common/db";
import { hashNavigate } from "../navigation";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";

function Home() {
  useStore((store) => store.nonce);
  const notes = useStore((store) => store.notes);
  const isCompact = useStore((store) => store.viewMode === "compact");
  const refresh = useStore((store) => store.refresh);
  const clearContext = useStore((store) => store.clearContext);
  const [isLoading, setIsLoading] = useState(true);
  useNavigate("home", () => {
    clearContext();
  });

  useEffect(() => {
    (async function () {
      const initialized = db.notes.initialized;
      if (!initialized || !notes.length) {
        await db.notes.init();
        store.refresh();
        setIsLoading(false);
      }
      // const note = db.notes.note("62bc3f28a1a1a10000707077").data;
      // const data = await db.content.raw(note.contentId);

      // const note2 = db.notes.note("62bc3f1ca1a1a10000707075").data;
      // const data2 = await db.content.raw(note2.contentId);

      // const data3 = { ...data, conflicted: data2 };

      // await db.content.add(data3);
      // await db.notes.add({ id: note.id, conflicted: true, resolved: false });
      // console.log(data3);
    })();
  }, [notes.length]);

  return (
    <ListContainer
      type="home"
      groupType="home"
      compact={isCompact}
      refresh={refresh}
      isLoading={isLoading}
      items={notes}
      placeholder={<Placeholder context="notes" />}
      button={{
        content: "Make a new note",
        onClick: () =>
          hashNavigate("/notes/create", { replace: true, addNonce: true })
      }}
    />
  );
}
export default React.memo(Home, () => true);
