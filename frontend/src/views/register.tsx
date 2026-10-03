"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/shared/api/client";
import { safeReturnTo, withReturnTo } from "@/shared/auth/return-to";
import { writeSession, type Session } from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import type { MessageKey } from "@/shared/i18n/messages";
import { notify } from "@/shared/ui/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type RegistrationResponse = Session & { emailVerification: "not_configured" };
type RegistrationField =
  "name" | "email" | "password" | "confirmPassword" | "consent";
type RegistrationErrors = Partial<Record<RegistrationField, MessageKey>>;

const serverErrorMessages: Record<string, MessageKey> = {
  INVALID_NAME: "invalidName",
  INVALID_EMAIL: "invalidEmail",
  WEAK_PASSWORD: "weakPassword",
  CONSENT_REQUIRED: "consentRequired",
};

export function validateRegistration(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
}): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const normalizedName = values.name.trim().replace(/\s+/g, " ");
  const normalizedEmail = values.email.trim().toLowerCase();
  const passwordBytes = new TextEncoder().encode(values.password).length;

  if (normalizedName.length < 2 || normalizedName.length > 100)
    errors.name = "invalidName";
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    errors.email = "invalidEmail";
  }
  if (
    values.password.length < 10 ||
    passwordBytes > 72 ||
    !/[\p{L}]/u.test(values.password) ||
    !/\d/.test(values.password)
  ) {
    errors.password = "weakPassword";
  }
  if (values.confirmPassword !== values.password)
    errors.confirmPassword = "passwordMismatch";
  if (!values.consent) errors.consent = "consentRequired";
  return errors;
}

export function RegisterView({ returnTo }: { returnTo?: string }) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});

  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      password: String(data.get("password") || ""),
      confirmPassword: String(data.get("confirmPassword") || ""),
      consent: data.get("consent") === "on",
    };
    const validationErrors = validateRegistration(values);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    submittingRef.current = true;
    setPending(true);
    try {
      const session = await api<RegistrationResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: values.name.trim().replace(/\s+/g, " "),
            email: values.email.trim().toLowerCase(),
            password: values.password,
            consent: true,
            locale,
          }),
        },
        locale,
      );
      writeSession(session);
      notify.success(t("registrationSuccess"));
      router.replace(safeReturnTo(returnTo, "/dashboard/profile"));
    } catch (error) {
      if (error instanceof ApiError && error.code === "ACCOUNT_EXISTS") {
        notify.error(t("accountExists"));
      } else if (error instanceof ApiError && error.fieldErrors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(error.fieldErrors)
              .map(([field, code]) => [field, serverErrorMessages[code]])
              .filter((entry): entry is [string, MessageKey] =>
                Boolean(entry[1]),
              ),
          ) as RegistrationErrors,
        );
        notify.error(t("registrationInvalid"));
      } else {
        notify.error(t("registrationFailed"));
      }
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  const loginHref = withReturnTo(localizedPath(locale, "/login"), returnTo);
  const errorFor = (field: RegistrationField) =>
    fieldErrors[field] ? t(fieldErrors[field]) : undefined;

  return (
    <main className="auth-page register-page">
      <form
        className="auth-card register-card"
        onSubmit={submit}
        noValidate
        data-testid="register-form"
        data-hydrated={hydrated ? "true" : "false"}
      >
        <div className="auth-heading">
          <h1>{t("registerTitle")}</h1>
          <p>{t("registerIntro")}</p>
        </div>
        <Label className="auth-label">
          {t("name")}
          <Input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "register-name-error" : undefined
            }
          />
          {fieldErrors.name && (
            <span id="register-name-error" className="field-error">
              {errorFor("name")}
            </span>
          )}
        </Label>
        <Label className="auth-label">
          {t("email")}
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "register-email-error" : undefined
            }
          />
          {fieldErrors.email && (
            <span id="register-email-error" className="field-error">
              {errorFor("email")}
            </span>
          )}
        </Label>
        <div className="auth-field">
          <Label htmlFor="register-password">{t("password")}</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="register-password-help register-password-error"
          />
          <span id="register-password-help" className="field-help">
            {t("passwordRequirements")}
          </span>
          {fieldErrors.password && (
            <span id="register-password-error" className="field-error">
              {errorFor("password")}
            </span>
          )}
        </div>
        <Label className="auth-label">
          {t("confirmPassword")}
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={
              fieldErrors.confirmPassword ? "register-confirm-error" : undefined
            }
          />
          {fieldErrors.confirmPassword && (
            <span id="register-confirm-error" className="field-error">
              {errorFor("confirmPassword")}
            </span>
          )}
        </Label>
        <Label className="consent-control">
          <Checkbox
            name="consent"
            required
            aria-invalid={Boolean(fieldErrors.consent)}
            aria-describedby={
              fieldErrors.consent ? "register-consent-error" : undefined
            }
          />
          <span>{t("consentText")}</span>
        </Label>
        {fieldErrors.consent && (
          <span id="register-consent-error" className="field-error">
            {errorFor("consent")}
          </span>
        )}
        <p className="verification-note">{t("emailVerificationUnavailable")}</p>
        <Button
          className="w-full"
          type="submit"
          disabled={pending || !hydrated}
          aria-busy={pending}
        >
          {pending ? t("registering") : t("createAccount")}
        </Button>
        <p className="auth-switch">
          {t("alreadyHaveAccount")} <Link href={loginHref}>{t("login")}</Link>
        </p>
      </form>
    </main>
  );
}
