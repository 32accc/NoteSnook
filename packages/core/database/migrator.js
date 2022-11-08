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

import { sendMigrationProgressEvent } from "../common";
import { migrateCollection, migrateItem } from "../migrations";

class Migrator {
  async migrate(db, collections, get, version, restore = false) {
    for (let collection of collections) {
      if (!collection.index || !collection.dbCollection) continue;

      if (collection.dbCollection.collectionName)
        sendMigrationProgressEvent(
          db.eventManager,
          collection.dbCollection.collectionName,
          0,
          0
        );

      await migrateCollection(collection.dbCollection, version);

      const index = (await collection.index()) || [];
      for (var i = 0; i < index.length; ++i) {
        let id = index[i];
        let item = get(id, collection.dbCollection.collectionName);
        if (!item) {
          continue;
        }

        if (collection.dbCollection.collectionName)
          sendMigrationProgressEvent(
            db.eventManager,
            collection.dbCollection.collectionName,
            index.length,
            i + 1
          );

        // check if item is permanently deleted or just a soft delete
        if (item.deleted && !item.type) {
          await collection.dbCollection?._collection?.addItem(item);
          continue;
        }

        const itemId = item.id;
        const migrated = await migrateItem(
          item,
          version,
          item.type || collection.type || collection.dbCollection.type,
          db
        );

        if (migrated || restore) {
          if (collection.dbCollection.merge) {
            await collection.dbCollection.merge(item);
          } else if (collection.dbCollection.add) {
            await collection.dbCollection.add(item);
          }

          // if id changed after migration, we need to delete the old one.
          if (item.id !== itemId) {
            await collection.dbCollection?._collection?.deleteItem(itemId);
          }
        }
      }
    }
    return true;
  }
}
export default Migrator;
