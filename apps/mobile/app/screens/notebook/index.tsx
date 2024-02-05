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
import { Note, Notebook, Topic } from "@notesnook/core/dist/types";
import { groupArray } from "@notesnook/core/dist/utils/grouping";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../../common/database";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { NotebookHeader } from "../../components/list-items/headers/notebook-header";
import { AddNotebookSheet } from "../../components/sheets/add-notebook";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore, {
  NotebookScreenParams
} from "../../stores/use-navigation-store";
import { eOnNewTopicAdded } from "../../utils/events";
import { openEditor, setOnFirstSave } from "../notes/common";

const NotebookScreen = ({ route, navigation }: NavigationProps<"Notebook">) => {
  const [notes, setNotes] = useState(
    groupArray(
      db.relations?.from(route.params.item, "note").resolved(),
      db.settings.getGroupOptions("notes")
    )
  );
  const params = useRef<NotebookScreenParams>(route?.params);

  useNavigationFocus(navigation, {
    onFocus: () => {
      Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      syncWithNavigation();
      useNavigationStore.getState().setButtonAction(openEditor);
      return false;
    },
    onBlur: () => {
      setOnFirstSave(null);
      return false;
    }
  });

  const syncWithNavigation = React.useCallback(() => {
    useNavigationStore.getState().update(
      {
        name: route.name,
        title: params.current?.title,
        id: params.current?.item?.id,
        type: "notebook"
      },
      params.current?.canGoBack
    );
    setOnFirstSave({
      type: "notebook",
      id: params.current.item.id
    });
    SearchService.prepareSearch = prepareSearch;
  }, [route.name]);

  const onRequestUpdate = React.useCallback(
    (data?: NotebookScreenParams) => {
      if (data) params.current = data;
      params.current.title = params.current.item.title;
      try {
        const notebook = db.notebooks?.notebook(
          params?.current?.item?.id
        )?.data;
        if (notebook) {
          params.current.item = notebook;
          const notes = db.relations?.from(notebook, "note").resolved();
          setNotes(
            groupArray(notes || [], db.settings.getGroupOptions("notes"))
          );
          syncWithNavigation();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [syncWithNavigation]
  );

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    };
  }, [onRequestUpdate]);

  useEffect(() => {
    return () => {
      setOnFirstSave(null);
    };
  }, []);

  const prepareSearch = () => {
    SearchService.update({
      placeholder: `Search in "${params.current.title}"`,
      type: "notes",
      title: params.current.title,
      get: () => {
        const notebook = db.notebooks?.notebook(
          params?.current?.item?.id
        )?.data;
        if (!notebook) return [];

        const notes = db.relations?.from(notebook, "note") || [];
        const topicNotes = db.notebooks
          .notebook(notebook.id)
          ?.topics.all.map((topic: Topic) => {
            return db.notes?.topicReferences
              .get(topic.id)
              .map((id: string) => db.notes?.note(id)?.data);
          })
          .flat()
          .filter(
            (topicNote) =>
              notes.findIndex((note) => note?.id !== topicNote?.id) === -1
          ) as Note[];

        return [...notes, ...topicNotes];
      }
    });
  };

  const PLACEHOLDER_DATA = {
    heading: params.current.item?.title,
    paragraph: "You have not added any notes yet.",
    button: "Add your first note",
    action: openEditor,
    loading: "Loading notebook notes"
  };

  return (
    <>
      <DelayLayout>
        <List
          listData={notes}
          type="notes"
          refreshCallback={() => {
            onRequestUpdate();
          }}
          screen="Notebook"
          headerProps={{
            heading: params.current.title
          }}
          loading={false}
          ListHeader={
            <NotebookHeader
              onEditNotebook={() => {
                AddNotebookSheet.present(params.current.item);
              }}
              notebook={params.current.item}
            />
          }
          placeholderData={PLACEHOLDER_DATA}
        />
      </DelayLayout>
    </>
  );
};

NotebookScreen.navigate = (item: Notebook, canGoBack: boolean) => {
  if (!item) return;
  Navigation.navigate<"Notebook">(
    {
      title: item.title,
      name: "Notebook",
      id: item.id,
      type: "notebook"
    },
    {
      title: item.title,
      item: item,
      canGoBack
    }
  );
};

export default NotebookScreen;
