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

import { Perform } from "../../../common/dialog-controller";
import { Icon } from "../../icons";

export type AuthenticatorType = "app" | "sms" | "email";

export type Authenticator = {
  type: AuthenticatorType;
  title: string;
  subtitle: string;
  icon: Icon;
  recommended?: boolean;
};

export type StepComponentProps<T extends OnNextFunction> = {
  onNext: T;
  onClose?: Perform;
  onError?: (error: string) => void;
};

export type StepComponent<T extends OnNextFunction> = React.FunctionComponent<
  StepComponentProps<T>
>;

export type SubmitCodeFunction = (code: string) => void;

export type OnNextFunction = (...args: never[]) => void;
