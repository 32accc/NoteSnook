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

import "./polyfills";
import "@notesnook/core/types";
import {
  AppEventManager,
  AppEvents
} from "@notesnook/web/src/common/app-events";
import { render } from "react-dom";
import {
  getCurrentHash,
  getCurrentPath,
  makeURL
} from "@notesnook/web/src/navigation";
import Config from "@notesnook/web/src/utils/config";

import { initalizeLogger, logger } from "@notesnook/web/src/utils/logger";
import { AuthProps } from "@notesnook/web/src/views/auth";
import { loadDatabase } from "@notesnook/web/src/hooks/use-database";

type Route<TProps = null> = {
  component: () => Promise<{
    default: TProps extends null
      ? () => JSX.Element
      : (props: TProps) => JSX.Element;
  }>;
  props: TProps | null;
};

type RouteWithPath<T = null> = {
  route: Route<T>;
  path: Routes;
};

type Routes = keyof typeof routes;
// | "/account/recovery"
// | "/account/verified"
// | "/signup"
// | "/login"
// | "/sessionexpired"
// | "/recover"
// | "/mfa/code"
// | "/mfa/select"
// | "default";

const routes = {
  "/account/recovery": {
    component: () => import("@notesnook/web/src/views/recovery"),
    props: { route: "methods" }
  },
  "/account/verified": {
    component: () => import("@notesnook/web/src/views/email-confirmed"),
    props: {}
  },
  "/signup": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "signup" }
  },
  "/sessionexpired": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "sessionExpiry" }
  },
  "/login": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "login:email" }
  },
  "/login/password": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "login:email" }
  },
  "/recover": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "recover" }
  },
  "/login/mfa/code": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "login:email" }
  },
  "/login/mfa/select": {
    component: () => import("@notesnook/web/src/views/auth"),
    props: { route: "login:email" }
  },
  default: { component: () => import("./app"), props: null }
} as const;

const sessionExpiryExceptions: Routes[] = [
  "/recover",
  "/account/recovery",
  "/sessionexpired",
  "/login/mfa/code",
  "/login/mfa/select",
  "/login/password"
];

const serviceWorkerWhitelist: Routes[] = ["default"];

function getRoute(): RouteWithPath<AuthProps> | RouteWithPath {
  const path = getCurrentPath() as Routes;
  logger.info(`Getting route for path: ${path}`);

  const signup = redirectToRegistration(path);
  const sessionExpired = isSessionExpired(path);
  const fallback = fallbackRoute();
  const route = (
    routes[path] ? { route: routes[path], path } : null
  ) as RouteWithPath<AuthProps> | null;

  return signup || sessionExpired || route || fallback;
}

function fallbackRoute(): RouteWithPath {
  return { route: routes.default, path: "default" };
}

function redirectToRegistration(path: Routes): RouteWithPath<AuthProps> | null {
  if (!IS_TESTING && !shouldSkipInitiation() && !routes[path]) {
    window.history.replaceState({}, "", makeURL("/signup", getCurrentHash()));
    return { route: routes["/signup"], path: "/signup" };
  }
  return null;
}

function isSessionExpired(path: Routes): RouteWithPath<AuthProps> | null {
  const isSessionExpired = Config.get("sessionExpired", false);
  if (isSessionExpired && !sessionExpiryExceptions.includes(path)) {
    logger.info(`User session has expired. Routing to /sessionexpired`);

    window.history.replaceState(
      {},
      "",
      makeURL("/sessionexpired", getCurrentHash())
    );
    return { route: routes["/sessionexpired"], path: "/sessionexpired" };
  }
  return null;
}

renderApp();

async function renderApp() {
  await initalizeLogger();
  const {
    path,
    route: { component, props }
  } = getRoute();

  if (serviceWorkerWhitelist.includes(path)) await initializeServiceWorker();
  if (IS_DESKTOP_APP) await loadDatabase("db");

  logger.measure("app render");

  const { default: Component } = await component();
  render(
    <Component route={props?.route || "login:email"} />,
    document.getElementById("root"),
    () => {
      logger.measure("app render");

      document.getElementById("splash")?.remove();
    }
  );
}

async function initializeServiceWorker() {
  if (!IS_DESKTOP_APP) {
    logger.info("Initializing service worker...");
    const serviceWorker = await import("./service-worker-registration");

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.register({
      onUpdate: async (registration: ServiceWorkerRegistration) => {
        if (!registration.waiting) return;
        const { getServiceWorkerVersion } = await import(
          "@notesnook/web/src/utils/version"
        );
        const { formatted } = await getServiceWorkerVersion(
          registration.waiting
        );
        AppEventManager.publish(AppEvents.updateDownloadCompleted, {
          version: formatted
        });
      }
    });
    // window.addEventListener("beforeinstallprompt", () => showInstallNotice());
  }
}

function shouldSkipInitiation() {
  return localStorage.getItem("skipInitiation") || false;
}
