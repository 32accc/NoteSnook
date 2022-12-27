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

import { useMemo } from "react";
import { Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import AnnouncementBody from "./body";

function Announcements({ announcements, removeAnnouncement }) {
  const announcement = useMemo(() => announcements[0], [announcements]);

  return (
    <Flex
      mx={1}
      mb={2}
      py={2}
      bg="bgSecondary"
      sx={{
        borderRadius: "default",
        position: "relative",
        flexDirection: "column"
      }}
    >
      <Text
        bg="errorBg"
        p="2px"
        sx={{
          position: "absolute",
          right: 2,
          top: 2,
          borderRadius: 50,
          cursor: "pointer",
          alignSelf: "end"
        }}
        title="Dismiss announcement"
        onClick={() => {
          trackEvent(
            ANALYTICS_EVENTS.announcementDismissed,
            announcement.title
          );
          removeAnnouncement && removeAnnouncement(announcement.id);
        }}
      >
        <Icon.Cross color="error" size={16} />
      </Text>
      <AnnouncementBody components={announcement.body} type="inline" />
    </Flex>
  );
}

export default Announcements;
