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
  const [formError, setFormError] = useState<MessageKey | null>(null);

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
    setFormError(null);
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
      router.replace(safeReturnTo(returnTo, "/dashboard/profile"));
    } catch (error) {
      if (error instanceof ApiError && error.code === "ACCOUNT_EXISTS") {
        setFormError("accountExists");
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
        setFormError("registrationInvalid");
      } else {
        setFormError("registrationFailed");
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
        {formError && (
          <p className="error auth-status" role="alert">
            {t(formError)}
          </p>
        )}
        <label>
          {t("name")}
          <input
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
        </label>
        <label>
          {t("email")}
          <input
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
        </label>
        <div className="auth-field">
          <label htmlFor="register-password">{t("password")}</label>
          <input
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
        <label>
          {t("confirmPassword")}
          <input
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
        </label>
        <label className="consent-control">
          <input
            name="consent"
            type="checkbox"
            required
            aria-invalid={Boolean(fieldErrors.consent)}
            aria-describedby={
              fieldErrors.consent ? "register-consent-error" : undefined
            }
          />
          <span>{t("consentText")}</span>
        </label>
        {fieldErrors.consent && (
          <span id="register-consent-error" className="field-error">
            {errorFor("consent")}
          </span>
        )}
        <p className="verification-note">{t("emailVerificationUnavailable")}</p>
        <button
          className="button primary"
          disabled={pending || !hydrated}
          aria-busy={pending}
        >
          {pending ? t("registering") : t("createAccount")}
        </button>
        <p className="auth-switch">
          {t("alreadyHaveAccount")} <Link href={loginHref}>{t("login")}</Link>
        </p>
      </form>
    </main>
  );
}
