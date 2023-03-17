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

import {
  Editor,
  findParentNode,
  NodeWithPos,
  Predicate,
  findParentNodeClosestToPos,
  getChangedRanges
} from "@tiptap/core";
import {
  NodeRange,
  Node as ProsemirrorNode,
  Mark,
  NodeType,
  ResolvedPos,
  Attrs
} from "prosemirror-model";
import { EditorState, Selection, Transaction } from "prosemirror-state";
import { BulletList } from "../extensions/bullet-list";
import { ListItem } from "../extensions/list-item";
import { OrderedList } from "../extensions/ordered-list";
import { OutlineList } from "../extensions/outline-list";
import { OutlineListItem } from "../extensions/outline-list-item";
import { TaskItemNode } from "../extensions/task-item";
import { TaskListNode } from "../extensions/task-list";
import { LIST_NODE_TYPES } from "./node-types";

export type NodeWithOffset = {
  node?: ProsemirrorNode;
  from: number;
  to: number;
};

export function hasSameAttributes(prev: Attrs, next: Attrs) {
  for (const key in prev) {
    const prevValue = prev[key];
    const nextValue = next[key];
    if (prevValue !== nextValue) return false;
  }
  return true;
}

export function findListItemType(editor: Editor): string | null {
  const isTaskList = editor.isActive(TaskListNode.name);
  const isOutlineList = editor.isActive(OutlineList.name);
  const isList =
    editor.isActive(BulletList.name) || editor.isActive(OrderedList.name);

  return isList
    ? ListItem.name
    : isOutlineList
    ? OutlineListItem.name
    : isTaskList
    ? TaskItemNode.name
    : null;
}

export function isListActive(editor: Editor): boolean {
  return LIST_NODE_TYPES.some((name) => editor.isActive(name));
}

export function findSelectedDOMNode(
  editor: Editor,
  types: string[]
): HTMLElement | null {
  const { $anchor } = editor.state.selection;

  const selectedNode = editor.state.doc.nodeAt($anchor.pos);
  const pos = types.includes(selectedNode?.type.name || "")
    ? $anchor.pos
    : findParentNode((node) => types.includes(node.type.name))(
        editor.state.selection
      )?.pos;
  if (!pos) return null;

  return (editor.view.nodeDOM(pos) as HTMLElement) || null;
}

export function findSelectedNode(
  editor: Editor,
  type: string
): ProsemirrorNode | null {
  const { $anchor } = editor.state.selection;

  const selectedNode = editor.state.doc.nodeAt($anchor.pos);
  const pos =
    selectedNode?.type.name === type
      ? $anchor.pos
      : findParentNode((node) => node.type.name === type)(
          editor.state.selection
        )?.pos;
  if (pos === undefined) return null;

  return editor.state.doc.nodeAt(pos);
}

export function findMark(
  node: ProsemirrorNode,
  type: string
): Mark | undefined {
  const mark = node.marks.find((m) => m.type.name === type);
  return mark;
}

export function selectionToOffset(state: EditorState): NodeWithOffset {
  const { $from, from } = state.selection;
  return {
    node: state.doc.nodeAt(from) || undefined,
    from,
    to: from + $from.node().nodeSize
  };
}

export const findChildren = (
  node: ProsemirrorNode,
  predicate: Predicate,
  descend: boolean
) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  } else if (!predicate) {
    throw new Error('Invalid "predicate" parameter');
  }
  return walkNode(node, descend).filter((child) => predicate(child.node));
};

export function findChildrenByType(
  node: ProsemirrorNode,
  nodeType: NodeType,
  descend = true
): NodeWithPos[] {
  return findChildren(node, (child) => child.type === nodeType, descend);
}

export const findParentNodeOfTypeClosestToPos = (
  $pos: ResolvedPos,
  nodeType: NodeType
) => {
  return findParentNodeClosestToPos($pos, (node) =>
    equalNodeType(nodeType, node)
  );
};

export function hasParentNode(predicate: Predicate) {
  return function (selection: Selection) {
    return !!findParentNode(predicate)(selection);
  };
}

export function hasParentNodeOfType(nodeType: NodeType | NodeType[]) {
  return hasParentNode((node) => equalNodeType(nodeType, node));
}

export function findParentNodeOfType(nodeType: NodeType | NodeType[]) {
  return findParentNode((node) => equalNodeType(nodeType, node));
}

const walkNode = (node: ProsemirrorNode, descend = true) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  }
  const result: NodeWithPos[] = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    if (!descend) {
      return false;
    }
  });
  return result;
};

const equalNodeType = (
  nodeType: NodeType | NodeType[],
  node: ProsemirrorNode
) => {
  return (
    (Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1) ||
    node.type === nodeType
  );
};

export function getChangedNodeRanges(tr: Transaction): NodeRange[] {
  // The container of the ranges to be returned from this function.
  const nodeRanges: NodeRange[] = [];
  const ranges = getChangedRanges(tr);

  for (const range of ranges) {
    try {
      const $from = tr.doc.resolve(range.newRange.from);
      const $to = tr.doc.resolve(range.newRange.to);

      // Find the node range for this provided range.
      const nodeRange = $from.blockRange($to);

      // Make sure a valid node is available.
      if (nodeRange) {
        nodeRanges.push(nodeRange);
      }
    } catch {
      // Changed ranged outside the document
    }
  }

  return nodeRanges;
}

interface GetChangedNodesOptions {
  /**
   * Whether to descend into child nodes.
   *
   * @defaultValue false
   */
  descend?: boolean;

  /**
   * A predicate test for node which was found. Return `false` to skip the node.
   *
   * @param node - the node that was found
   * @param pos - the pos of that node
   * @param range - the `NodeRange` which contained this node.
   */
  predicate?: (node: ProsemirrorNode, pos: number, range: NodeRange) => boolean;
}

/**
 * Get all the changed nodes from the provided transaction.
 *
 * The following example will give us all the text nodes in the provided
 * transaction.
 *
 * ```ts
 * import { getChangedNodes } from 'remirror/core';
 *
 * const changedTextNodes = getChangeNodes(tr, { descend: true, predicate: (node) => node.isText });
 * ```
 */
export function getChangedNodes(
  tr: Transaction,
  options: GetChangedNodesOptions = {}
): NodeWithPos[] {
  const { descend = false, predicate } = options;
  const nodeRange = getChangedNodeRanges(tr);

  // The container for the nodes which have been added..
  const nodes: NodeWithPos[] = [];

  for (const range of nodeRange) {
    const { start, end } = range;

    // Find all the nodes between the provided node range.
    tr.doc.nodesBetween(start, end, (node, pos) => {
      // Check wether this is a node that should be added.
      const shouldAdd = predicate?.(node, pos, range) ?? true;

      if (shouldAdd) {
        nodes.push({ node, pos });
      }

      return descend;
    });
  }

  return nodes;
}
