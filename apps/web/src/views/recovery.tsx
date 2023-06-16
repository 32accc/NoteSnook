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

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { Error as ErrorIcon } from "../components/icons";
import { makeURL, useQueryParams } from "../navigation";
import { db } from "../common/db";
import useDatabase from "../hooks/use-database";
import Loader from "../components/loader";
import { showToast } from "../utils/toast";
import AuthContainer from "../components/auth-container";
import { AuthField, SubmitButton } from "./auth";
import { createBackup, restoreBackupFile, selectBackupFile } from "../common";
import { showRecoveryKeyDialog } from "../common/dialog-controller";
import Config from "../utils/config";
import { EVENTS } from "@notesnook/core/common";

type RecoveryMethodType = "key" | "backup" | "reset";
type RecoveryMethodsFormData = Record<string, unknown>;

type RecoveryKeyFormData = {
  recoveryKey: string;
};

type BackupFileFormData = {
  backupFile: {
    file: File;
    backup: Record<string, unknown>;
  };
};

type NewPasswordFormData = BackupFileFormData & {
  userResetRequired?: boolean;
  password: string;
  confirmPassword: string;
};

type RecoveryFormData = {
  methods: RecoveryMethodsFormData;
  "method:key": RecoveryKeyFormData;
  "method:backup": BackupFileFormData;
  "method:reset": NewPasswordFormData;
  backup: RecoveryMethodsFormData;
  new: NewPasswordFormData;
  final: RecoveryMethodsFormData;
};

type BaseFormData = RecoveryMethodsFormData;

type NavigateFunction = <TRoute extends RecoveryRoutes>(
  route: TRoute,
  formData?: Partial<RecoveryFormData[TRoute]>
) => void;
type BaseRecoveryComponentProps<TRoute extends RecoveryRoutes> = {
  navigate: NavigateFunction;
  formData?: Partial<RecoveryFormData[TRoute]>;
};
type RecoveryRoutes =
  | "methods"
  | "method:key"
  | "method:backup"
  | "method:reset"
  | "backup"
  | "new"
  | "final";
type RecoveryProps = { route: RecoveryRoutes };

type RecoveryComponent<TRoute extends RecoveryRoutes> = (
  props: BaseRecoveryComponentProps<TRoute>
) => JSX.Element;

function getRouteComponent<TRoute extends RecoveryRoutes>(
  route: TRoute
): RecoveryComponent<TRoute> | undefined {
  switch (route) {
    case "methods":
      return RecoveryMethods as RecoveryComponent<TRoute>;
    case "method:key":
      return RecoveryKeyMethod as RecoveryComponent<TRoute>;
    case "method:backup":
      return BackupFileMethod as RecoveryComponent<TRoute>;
    case "backup":
      return BackupData as RecoveryComponent<TRoute>;
    case "method:reset":
    case "new":
      return NewPassword as RecoveryComponent<TRoute>;
    case "final":
      return Final as RecoveryComponent<TRoute>;
  }
  return undefined;
}

const routePaths: Record<RecoveryRoutes, string> = {
  methods: "/account/recovery/methods",
  "method:key": "/account/recovery/method/key",
  "method:backup": "/account/recovery/method/backup",
  "method:reset": "/account/recovery/method/reset",
  backup: "/account/recovery/backup",
  new: "/account/recovery/new",
  final: "/account/recovery/final"
};

function useAuthenticateUser({
  code,
  userId
}: {
  code: string;
  userId: string;
}) {
  const [isAppLoaded] = useDatabase(isSessionExpired() ? "db" : "memory");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<User>();
  useEffect(() => {
    if (!isAppLoaded) return;
    async function authenticateUser() {
      setIsAuthenticating(true);
      try {
        await db.init();

        const accessToken = await db.user?.tokenManager.getAccessToken();
        if (!accessToken) {
          await db.user?.tokenManager.getAccessTokenFromAuthorizationCode(
            userId,
            code.replace(/ /gm, "+")
          );
        }
        const user = await db.user?.fetchUser();
        setUser(user);
      } catch (e) {
        showToast("error", "Failed to authenticate. Please try again.");
        openURL("/");
      } finally {
        setIsAuthenticating(false);
      }
    }

    authenticateUser();
  }, [code, userId, isAppLoaded]);
  return { isAuthenticating, user };
}

function Recovery(props: RecoveryProps) {
  const [route, setRoute] = useState(props.route);
  const [storedFormData, setStoredFormData] = useState<
    BaseFormData | undefined
  >();

  const [{ code, userId }] = useQueryParams();
  const { isAuthenticating, user } = useAuthenticateUser({ code, userId });
  const Route = useMemo(() => getRouteComponent(route), [route]);
  useEffect(() => {
    window.history.replaceState({}, "", makeURL(routePaths[route]));
  }, [route]);

  return (
    <AuthContainer>
      <Flex
        sx={{
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          flexDirection: "column"
        }}
      >
        {isAuthenticating ? (
          <Loader
            title="Authenticating user"
            text={"Please wait while you are authenticated."}
          />
        ) : (
          <>
            <Flex
              m={2}
              sx={{ alignItems: "start", justifyContent: "space-between" }}
            >
              <Text
                sx={{
                  display: "flex",
                  alignSelf: "end",
                  alignItems: "center"
                }}
                variant={"body"}
              >
                Authenticated as {user?.email}
              </Text>
              <Button
                sx={{
                  display: "flex",
                  mt: 0,
                  ml: 2,
                  alignSelf: "start",
                  alignItems: "center"
                }}
                variant={"secondary"}
                onClick={() => openURL("/login")}
              >
                Remembered your password?
              </Button>
            </Flex>
            {Route && (
              <Route
                navigate={(route, formData) => {
                  setStoredFormData(formData);
                  setRoute(route);
                }}
                formData={storedFormData}
              />
            )}
          </>
        )}
      </Flex>
    </AuthContainer>
  );
}
export default Recovery;

type RecoveryMethod = {
  type: RecoveryMethodType;
  title: string;
  testId: string;
  description: string;
  isDangerous?: boolean;
};

const recoveryMethods: RecoveryMethod[] = [
  {
    type: "key",
    testId: "step-recovery-key",
    title: "Use recovery key",
    description:
      "Your data recovery key is basically a hashed version of your password (plus some random salt). It can be used to decrypt your data for re-encryption."
  },
  {
    type: "backup",
    testId: "step-backup",
    title: "Use a backup file",
    description:
      "If you don't have a recovery key, you can recover your data by restoring a Notesnook data backup file (.nnbackup)."
  },
  {
    type: "reset",
    testId: "step-reset-account",
    title: "Clear data & reset account",
    description:
      "EXTREMELY DANGEROUS! This action is irreversible. All your data including notes, notebooks, attachments & settings will be deleted. This is a full account reset. Proceed with caution.",
    isDangerous: true
  }
];
function RecoveryMethods(props: BaseRecoveryComponentProps<"methods">) {
  const { navigate } = props;
  const [selected, setSelected] = useState(0);

  if (isSessionExpired()) {
    navigate("new");
    return null;
  }

  return (
    <RecoveryForm
      testId="step-recovery-methods"
      type="methods"
      title="Choose a recovery method"
      subtitle="How do you want to recover your account?"
      onSubmit={async () => {
        const selectedMethod = recoveryMethods[selected].type;
        navigate(`method:${selectedMethod}`, {
          userResetRequired: selectedMethod === "reset"
        });
      }}
    >
      {recoveryMethods.map((method, index) => (
        <Button
          key={method.testId}
          data-test-id={method.testId}
          type="submit"
          variant={"secondary"}
          mt={2}
          sx={{
            ":first-of-type": { mt: 2 },
            display: "flex",
            flexDirection: "column",
            bg: method.isDangerous ? "errorBg" : "bgSecondary",
            alignSelf: "stretch",
            // alignItems: "center",
            textAlign: "left",
            px: 2
          }}
          onClick={() => setSelected(index)}
        >
          <Text
            variant={"title"}
            sx={{ color: method.isDangerous ? "error" : "text" }}
          >
            {method.title}
          </Text>
          <Text
            variant={"body"}
            sx={{ color: method.isDangerous ? "error" : "fontTertiary" }}
          >
            {method.description}
          </Text>
        </Button>
      ))}
    </RecoveryForm>
  );
}

function RecoveryKeyMethod(props: BaseRecoveryComponentProps<"method:key">) {
  const { navigate } = props;
  const [progress, setProgress] = useState("0");

  useEffect(() => {
    db.eventManager.subscribe(
      EVENTS.syncProgress,
      ({
        type,
        total,
        current
      }: {
        type: string;
        total: number;
        current: number;
      }) => {
        if (total === current) return;
        if (type === "download") {
          setProgress(((current / total) * 100).toFixed());
        }
      }
    );
  }, []);

  return (
    <RecoveryForm
      testId="step-recovery-key"
      type="method:key"
      title="Recover your account"
      subtitle={"Use a data recovery key to reset your account password."}
      loading={{
        title: `Downloading your data (${progress}%)`,
        subtitle: "Please wait while your data is downloaded & decrypted."
      }}
      onSubmit={async (form) => {
        setProgress("0");

        const user = await db.user?.getUser();
        if (!user) throw new Error("User not authenticated");
        await db.storage?.write(`_uk_@${user.email}@_k`, form.recoveryKey);
        await db.sync(true, true);
        navigate("backup");
      }}
    >
      <AuthField
        id="recoveryKey"
        type="password"
        label="Enter your data recovery key"
        helpText="Your data recovery key will be used to decrypt your data"
        autoComplete="none"
        autoFocus
      />
      <SubmitButton text="Start account recovery" />

      <Button
        type="button"
        mt={4}
        variant={"anchor"}
        onClick={() => navigate("methods")}
        sx={{ color: "text" }}
      >
        {`Don't have your recovery key?`}
      </Button>
    </RecoveryForm>
  );
}

function BackupFileMethod(props: BaseRecoveryComponentProps<"method:backup">) {
  const { navigate } = props;
  const [backupFile, setBackupFile] =
    useState<BackupFileFormData["backupFile"]>();

  useEffect(() => {
    if (!backupFile) return;
    const backupFileInput = document.getElementById("backupFile");
    if (!(backupFileInput instanceof HTMLInputElement)) return;
    backupFileInput.value = backupFile?.file?.name;
  }, [backupFile]);

  return (
    <RecoveryForm
      testId="step-backup-file"
      type="method:backup"
      title="Recover your account"
      subtitle={
        <Text
          variant="body"
          sx={{
            borderRadius: "default",
            color: "error",
            bg: "errorBg",
            px: 1,
            mt: 2
          }}
        >
          All the data in your account will be overwritten with the data in the
          backup file. There is no way to reverse this action.
        </Text>
      }
      onSubmit={async () => {
        navigate("new", { backupFile, userResetRequired: true });
      }}
    >
      <AuthField
        id="backupFile"
        type="text"
        label="Select backup file"
        helpText="Backup files have .nnbackup extension"
        autoComplete="none"
        autoFocus
        disabled
        action={{
          component: <Text variant={"body"}>Browse</Text>,
          onClick: async () => {
            setBackupFile(await selectBackupFile());
          }
        }}
      />
      <SubmitButton text="Start account recovery" />

      <Button
        type="button"
        mt={4}
        variant={"anchor"}
        onClick={() => navigate("methods")}
        sx={{ color: "text" }}
      >
        {`Don't have a backup file?`}
      </Button>
    </RecoveryForm>
  );
}

function BackupData(props: BaseRecoveryComponentProps<"backup">) {
  const { navigate } = props;

  return (
    <RecoveryForm
      testId="step-backup-data"
      type="backup"
      title="Backup your data"
      subtitle={
        "Please download a backup of your data as your account will be cleared before recovery."
      }
      loading={{
        title: "Creating backup...",
        subtitle:
          "Please wait while we create a backup file for you to download."
      }}
      onSubmit={async () => {
        await createBackup();
        navigate("new");
      }}
    >
      <SubmitButton text="Download backup file" />
    </RecoveryForm>
  );
}

function NewPassword(props: BaseRecoveryComponentProps<"new">) {
  const { navigate, formData } = props;
  const [progress, setProgress] = useState("0");

  useEffect(() => {
    db.eventManager.subscribe(
      EVENTS.syncProgress,
      ({ total, current }: { total: number; current: number }) => {
        if (total === current) return;
        setProgress(((current / total) * 100).toFixed());
      }
    );
  }, []);

  return (
    <RecoveryForm
      testId="step-new-password"
      type="new"
      title="Reset account password"
      subtitle={
        "Notesnook is E2E encrypted — your password never leaves this device."
      }
      loading={{
        title: `Resetting account password (${progress}%)`,
        subtitle: "Please wait while we reset your account password."
      }}
      onSubmit={async (form) => {
        setProgress("0");

        if (form.password !== form.confirmPassword)
          throw new Error("Passwords do not match.");

        if (formData?.userResetRequired && !(await db.user?.resetUser()))
          throw new Error("Failed to reset user.");

        if (!(await db.user?.resetPassword(form.password)))
          throw new Error("Could not reset account password.");

        if (formData?.backupFile) {
          await restoreBackupFile(formData?.backupFile.backup);
          await db.sync(true, true);
        }

        navigate("final");
      }}
    >
      {(form?: NewPasswordFormData) => (
        <>
          <AuthField
            id="password"
            type="password"
            autoComplete="current-password"
            label="Set new password"
            helpText="Your account password must be strong & unique."
            defaultValue={form?.password}
          />
          <AuthField
            id="confirmPassword"
            type="password"
            autoComplete="confirm-password"
            label="Confirm new password"
            defaultValue={form?.confirmPassword}
          />
          <SubmitButton text="Continue" />
        </>
      )}
    </RecoveryForm>
  );
}

function Final(_props: BaseRecoveryComponentProps<"final">) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    async function finalize() {
      await showRecoveryKeyDialog();
      if (!isSessionExpired()) {
        await db.user?.logout(true, "Password changed.");
        await db.user?.clearSessions(true);
      }
      setIsReady(true);
    }
    finalize();
  }, []);

  if (!isReady && !isSessionExpired)
    return <Loader text="" title={"Finalizing. Please wait..."} />;

  return (
    <RecoveryForm
      testId="step-finished"
      type="final"
      title="Recovery successful!"
      subtitle={"Your account has been recovered."}
      onSubmit={async () => {
        openURL(isSessionExpired() ? "/sessionexpired" : "/login");
      }}
    >
      <SubmitButton
        text={
          isSessionExpired() ? "Continue with login" : "Login to your account"
        }
      />
    </RecoveryForm>
  );
}

type RecoveryFormProps<TType extends RecoveryRoutes> = {
  testId: string;
  title: string;
  subtitle: string | JSX.Element;
  loading?: { title: string; subtitle: string };
  type: TType;
  onSubmit: (form: RecoveryFormData[TType]) => Promise<void>;
  children?:
    | React.ReactNode
    | ((form?: RecoveryFormData[TType]) => React.ReactNode);
};

export function RecoveryForm<T extends RecoveryRoutes>(
  props: RecoveryFormProps<T>
) {
  const { title, subtitle, children, testId } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<RecoveryFormData[T] | undefined>();

  if (isSubmitting && props.loading)
    return <Loader title={props.loading.title} text={props.loading.subtitle} />;

  return (
    <Flex
      ref={formRef}
      data-test-id={testId}
      as="form"
      id="authForm"
      onSubmit={async (e) => {
        if (!formRef.current) return;

        e.preventDefault();

        setError("");
        setIsSubmitting(true);
        const formData = new FormData(formRef.current);
        const form = Object.fromEntries(
          formData.entries()
        ) as RecoveryFormData[T];
        try {
          setForm(form);
          await props.onSubmit(form);
        } catch (e) {
          console.error(e);
          const error = e as Error;
          setError(error.message);
        } finally {
          setIsSubmitting(false);
        }
      }}
      sx={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: ["95%", 420],
        alignSelf: "center"
      }}
    >
      <Text variant={"heading"} sx={{ fontSize: 32, textAlign: "center" }}>
        {title}
      </Text>
      <Text
        variant="body"
        mt={2}
        mb={35}
        sx={{ fontSize: "title", textAlign: "center", color: "fontTertiary" }}
      >
        {subtitle}
      </Text>
      {typeof children === "function" ? children(form) : children}
      {error && (
        <Flex bg="errorBg" p={1} mt={2} sx={{ borderRadius: "default" }}>
          <ErrorIcon size={15} color="error" />
          <Text variant="error" ml={1}>
            {error}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

function openURL(url: string) {
  window.open(url, "_self");
}

function isSessionExpired() {
  return Config.get("sessionExpired", false);
}
