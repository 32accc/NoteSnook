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

const template = `<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
    <meta
      name="description"
      content="{{headline}}"
    />
    <title>{{title}} - Notesnook</title>
    <meta name="created-on" content="{{createdOn}}" />
    <meta name="last-edited-on" content="{{editedOn}}" />
    <meta name="tags" content="{{tags}}" />
  </head>
  <body>
    <h1>{{title}}</h1>
    {{content}}
  </body>
</html>
`;
export default template;
