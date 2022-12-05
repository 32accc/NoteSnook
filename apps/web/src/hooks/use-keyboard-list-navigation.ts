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

import { useCallback, useRef } from "react";
import { keydownHandler } from "../common/key-handler";

enum DIRECTION {
  UP = -1,
  SAME = 0,
  DOWN = 1
}

type UseKeyboardListNavigationOptions = {
  length: number;
  reset: () => void;
  select: (index: number) => void;
  deselect: (index: number) => void;
  bulkSelect: (indices: number[]) => void;
  focusItemAt: (index: number) => void;
  open?: (index: number) => void;
  skip?: (index: number) => boolean;
};

export function useKeyboardListNavigation(
  options: UseKeyboardListNavigationOptions
) {
  const {
    length,
    skip,
    open,
    deselect,
    reset,
    select,
    bulkSelect,
    focusItemAt
  } = options;
  const cursor = useRef(-1);
  const anchor = useRef(-1);
  // const { reset, select, deselect } = useSelection();

  const direction = useCallback(() => {
    return cursor.current === anchor.current
      ? DIRECTION.SAME
      : cursor.current > anchor.current
      ? DIRECTION.DOWN
      : DIRECTION.UP;
  }, []);

  const onFocus = useCallback((itemIndex: number) => {
    cursor.current = itemIndex;
  }, []);

  const resetSelection = useCallback(() => {
    reset();
    anchor.current = -1;
  }, [reset]);

  const openActiveItem = useCallback(() => {
    if (!open) return false;
    resetSelection();
    open(cursor.current);
    select(cursor.current);
    return true;
  }, [open, resetSelection, select]);

  const onMouseDown = useCallback(
    (e: MouseEvent, itemIndex: number) => {
      if (e.ctrlKey || e.metaKey) {
        select(itemIndex);
      } else if (e.shiftKey) {
        const startIndex =
          itemIndex > cursor.current ? cursor.current : itemIndex;
        const endIndex =
          itemIndex > cursor.current ? itemIndex : cursor.current;
        const indices = [];
        for (let i = startIndex; i <= endIndex; ++i) {
          indices.push(i);
        }
        bulkSelect(indices);
        focusItemAt(endIndex);
      } else if (e.button === 0) {
        resetSelection();
        select(itemIndex);
      }
    },
    [select, resetSelection, bulkSelect, focusItemAt]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const max = length - 1;

      keydownHandler({
        Space: openActiveItem,
        Enter: openActiveItem,
        ArrowUp: () => {
          resetSelection();

          let nextIndex = moveUpCyclic(cursor.current, max);
          if (skip && skip(nextIndex)) nextIndex = moveUpCyclic(nextIndex, max);
          focusItemAt(nextIndex);
          return true;
        },
        ArrowDown: () => {
          resetSelection();

          let nextIndex = moveDownCyclic(cursor.current, max);
          if (skip && skip(nextIndex))
            nextIndex = moveDownCyclic(nextIndex, max);
          focusItemAt(nextIndex);
          return true;
        },
        "Ctrl-a": () => {
          resetSelection();
          for (let i = 0; i < length; ++i) select(i);
          return true;
        },
        "Shift-ArrowUp": () => {
          if (anchor.current === -1) {
            anchor.current = cursor.current;
            select(anchor.current);
          }

          if (direction() === DIRECTION.DOWN) {
            deselect(cursor.current);
          }

          let nextIndex = moveUp(cursor.current);
          if (skip && skip(nextIndex)) nextIndex = moveUp(nextIndex);
          if (nextIndex === cursor.current) return false;

          focusItemAt(nextIndex);
          if (direction() === DIRECTION.UP) {
            select(nextIndex);
          }
          return false;
        },
        "Shift-ArrowDown": () => {
          if (anchor.current === -1) {
            anchor.current = cursor.current;
            select(anchor.current);
          }

          if (direction() === DIRECTION.UP) {
            deselect(cursor.current);
          }

          let nextIndex = moveDown(cursor.current, max);
          if (skip && skip(nextIndex)) nextIndex = moveDown(nextIndex, max);
          if (nextIndex === cursor.current) return false;

          focusItemAt(nextIndex);
          if (direction() === DIRECTION.DOWN) {
            select(nextIndex);
          }
          return false;
        },
        Escape: () => {
          resetSelection();
          return true;
        }
      })(e);
    },
    [
      length,
      openActiveItem,
      resetSelection,
      skip,
      focusItemAt,
      select,
      direction,
      deselect
    ]
  );

  return { onFocus, onMouseDown, onKeyDown };
}

const moveDownCyclic = (i: number, max: number) => (i < max ? ++i : 0);
const moveUpCyclic = (i: number, max: number) => (i > 0 ? --i : max);
const moveDown = (i: number, max: number) => (i < max ? ++i : max);
const moveUp = (i: number) => (i > 0 ? --i : 0);
