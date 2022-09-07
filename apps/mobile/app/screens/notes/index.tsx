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

import React, { useEffect, useRef, useState } from "react";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore, {
  HeaderRightButton,
  NotesScreenParams,
  RouteName
} from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { NoteType, TopicType } from "../../utils/types";
import {
  getAlias,
  openEditor,
  openMonographsWebpage,
  setOnFirstSave,
  toCamelCase
} from "./common";
export const WARNING_DATA = {
  title: "Some notes in this topic are not synced"
};

export const PLACEHOLDER_DATA = {
  heading: "Your notes",
  paragraph: "You have not added any notes yet.",
  button: "Add your first Note",
  action: openEditor,
  loading: "Loading your notes."
};

export const MONOGRAPH_PLACEHOLDER_DATA = {
  heading: "Your monographs",
  paragraph: "You have not published any notes as monographs yet.",
  button: "Learn more about monographs",
  action: openMonographsWebpage,
  loading: "Loading published notes.",
  type: "monographs",
  buttonIcon: "information-outline"
};

export interface RouteProps<T extends RouteName> extends NavigationProps<T> {
  get: (params: NotesScreenParams, grouped?: boolean) => NoteType[];
  placeholderData: unknown;
  onPressFloatingButton: () => void;
  focusControl?: boolean;
  canGoBack?: boolean;
  rightButtons?: (params: NotesScreenParams) => HeaderRightButton[];
}

function getItemType(routeName: RouteName) {
  if (routeName === "TaggedNotes") return "tag";
  if (routeName === "ColoredNotes") return "color";
  if (routeName === "TopicNotes") return "topic";
  if (routeName === "Monographs") return "monograph";
  return "note";
}

const NotesPage = ({
  route,
  navigation,
  get,
  placeholderData,
  onPressFloatingButton,
  focusControl = true,
  rightButtons
}: RouteProps<
  "NotesPage" | "TaggedNotes" | "Monographs" | "ColoredNotes" | "TopicNotes"
>) => {
  const params = useRef<NotesScreenParams>(route?.params);
  const [notes, setNotes] = useState<NoteType[]>(get(route.params, true));
  const loading = useNoteStore((state) => state.loading);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const alias = getAlias(params.current);
  const isMonograph = route.name === "Monographs";

  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      syncWithNavigation();
      if (focusControl) return !prev.current;
      return false;
    },
    onBlur: () => {
      setOnFirstSave(null);
      return false;
    },
    focusOnInit: !focusControl
  });

  const prepareSearch = React.useCallback(() => {
    const { item } = params.current;
    SearchService.update({
      placeholder: `Search in ${alias}`,
      type: "notes",
      title: item.type === "tag" ? "#" + alias : toCamelCase(item.title),
      get: () => {
        return get(params.current, false);
      }
    });
  }, [alias, get]);

  const syncWithNavigation = React.useCallback(() => {
    const { item, title } = params.current;
    const alias = getAlias(params.current);
    useNavigationStore.getState().update(
      {
        name: route.name,
        title: alias || title,
        id: item?.id,
        type: "notes",
        notebookId: (item as TopicType).notebookId,
        alias:
          route.name === "ColoredNotes" ? toCamelCase(alias as string) : alias,
        color:
          route.name === "ColoredNotes" ? item.title?.toLowerCase() : undefined
      },
      params.current.canGoBack,
      rightButtons && rightButtons(params.current)
    );
    SearchService.prepareSearch = prepareSearch;
    useNavigationStore.getState().setButtonAction(onPressFloatingButton);

    !isMonograph &&
      setOnFirstSave({
        type: getItemType(route.name),
        id: item.id,
        color: item.title,
        notebook: (item as TopicType).notebookId
      });
  }, [
    isMonograph,
    onPressFloatingButton,
    prepareSearch,
    rightButtons,
    route.name
  ]);

  const onRequestUpdate = React.useCallback(
    (data?: NotesScreenParams) => {
      const isNew = data && data?.item?.id !== params.current?.item?.id;
      if (data) params.current = data;
      params.current.title = params.current.title || params.current.item.title;
      const { item } = params.current;
      try {
        if (isNew) setLoadingNotes(true);
        const notes = get(params.current, true) as NoteType[];
        if (
          (item.type === "tag" || item.type === "color") &&
          (!notes || notes.length === 0)
        ) {
          return Navigation.goBack();
        }
        setNotes(notes);
        syncWithNavigation();
      } catch (e) {
        console.error(e);
      }
    },
    [get, syncWithNavigation]
  );

  useEffect(() => {
    if (loadingNotes) {
      setTimeout(() => setLoadingNotes(false), 300);
    }
  }, [loadingNotes, notes]);

  useEffect(() => {
    eSubscribeEvent(route.name, onRequestUpdate);
    return () => {
      setOnFirstSave(null);
      eUnSubscribeEvent(route.name, onRequestUpdate);
    };
  }, [onRequestUpdate, route.name]);

  return (
    <DelayLayout
      color={
        route.name === "ColoredNotes"
          ? params.current?.item.title.toLowerCase()
          : undefined
      }
      wait={loading || loadingNotes}
    >
      <List
        listData={notes}
        type="notes"
        refreshCallback={onRequestUpdate}
        loading={loading || !isFocused}
        screen="Notes"
        headerProps={{
          heading: params.current.title,
          color:
            route.name === "ColoredNotes"
              ? params.current?.item.title.toLowerCase()
              : null
        }}
        placeholderData={placeholderData}
      />

      {notes?.length > 0 || (isFocused && !isMonograph) ? (
        <FloatingButton title="Create a note" onPress={onPressFloatingButton} />
      ) : null}
    </DelayLayout>
  );
};

export default NotesPage;
