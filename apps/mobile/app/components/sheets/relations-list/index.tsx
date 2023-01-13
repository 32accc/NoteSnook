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
import React, { RefObject, useEffect, useState } from "react";
import { View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import {
  PresentSheetOptions,
  presentSheet
} from "../../../services/event-manager";
import { Reminder } from "../../../services/notifications";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import DialogHeader from "../../dialog/dialog-header";
import List from "../../list";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import { PressableButtonProps } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

type RelationsListProps = {
  actionSheetRef: RefObject<ActionSheet>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
  item: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button?: Button;
  onAdd: () => void;
};

type Button = {
  onPress?: (() => void) | undefined;
  loading?: boolean | undefined;
  title?: string | undefined;
  type?: PressableButtonProps["type"];
  icon?: string;
};

const IconsByType = {
  reminder: "bell"
};

export const RelationsList = ({
  actionSheetRef,
  close,
  update,
  item,
  referenceType,
  relationType,
  title,
  button,
  onAdd
}: RelationsListProps) => {
  const updater = useRelationStore((state) => state.updater);
  const [items, setItems] = useState<Reminder[]>([]);
  const colors = useThemeStore((state) => state.colors);
  const hasNoRelations = !items || items.length === 0;

  useEffect(() => {
    setItems(
      db.relations?.[relationType]?.(
        { id: item?.id, type: item.type },
        referenceType
      ) as any
    );
  }, [item?.id, item?.type, referenceType, relationType, updater]);
  return (
    <View
      style={{ paddingHorizontal: 12, height: hasNoRelations ? 300 : "100%" }}
    >
      <SheetProvider context="local" />
      <DialogHeader
        title={title}
        button={hasNoRelations ? undefined : button}
      />
      {hasNoRelations ? (
        <View
          style={{
            height: "85%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Icon
            name={IconsByType[referenceType as keyof typeof IconsByType]}
            size={60}
            color={colors.icon}
          />
          <Paragraph>
            No {referenceType}s linked to this {item.type}.
          </Paragraph>
          <Button
            onPress={() => {
              onAdd?.();
            }}
            fontSize={SIZE.sm}
            //  width="100%"
            type="inverted"
            icon="plus"
            title={`Add a ${referenceType}`}
          />
        </View>
      ) : (
        <List
          listData={items}
          loading={false}
          type={referenceType}
          headerProps={null}
          isSheet={true}
          onMomentumScrollEnd={() => {
            actionSheetRef?.current?.handleChildScrollEnd();
          }}
        />
      )}
    </View>
  );
};

RelationsList.present = ({
  reference,
  referenceType,
  relationType,
  title,
  button,
  onAdd
}: {
  reference: { id: string; type: string };
  referenceType: string;
  relationType: "to" | "from";
  title: string;
  button?: Button;
  onAdd: () => void;
}) => {
  presentSheet({
    component: (ref, close, update) => (
      <RelationsList
        actionSheetRef={ref}
        close={close}
        update={update}
        item={reference}
        referenceType={referenceType}
        relationType={relationType}
        title={title}
        button={button}
        onAdd={onAdd}
      />
    )
  });
};
