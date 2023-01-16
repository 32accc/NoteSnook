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

import StorageInterface from "../__mocks__/storage.mock";
import Storage from "../database/storage";

const storage = new Storage(StorageInterface);
test("add a value", async () => {
  await storage.write("hello", "world");
  let value = await storage.read("hello");
  expect(value).toBe("world");
});

test("remove", async () => {
  await storage.remove("hello");
  let value = await storage.read("hello");
  expect(value).toBeUndefined();
});

test("clear", async () => {
  await storage.write("hello", "world");
  storage.clear();
  let value = await storage.read("hello");
  expect(value).toBeUndefined();
});
