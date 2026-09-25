"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Save,
  Send,
} from "lucide-react";
import { adminObjectsApi } from "./api";
import { LocationPicker } from "./location-picker";
import type {
  AdminObject,
  AdminObjectPayload,
  AdminMedia,
  AdminTranslation,
} from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";
import type { MessageKey } from "@/shared/i18n/messages";
import { statusMessageKey } from "@/shared/lib/dashboard";

const stepKeys: MessageKey[] = ["stepMain", "stepLocation", "stepTerms", "stepMedia", "stepReview"];
const sectors = [
  "manufacturing",
  "logistics",
  "tourism",
  "trade",
  "it",
  "agriculture",
  "construction",
  "energy",
];
const sectorMessageKeys: Record<string, MessageKey> = {
  manufacturing: "industry",
  logistics: "logistics",
  tourism: "tourism",
  trade: "trade",
  it: "itTechnology",
  agriculture: "agriculture",
  construction: "constructionSector",
  energy: "energy",
};
const emptyTranslation: AdminTranslation = {
  title: "",
  shortDescription: "",
  description: "",
  address: "",
  permittedBusinesses: [],
};
function translation(object: AdminObject | undefined, locale: "uz" | "ru") {
  return (
    object?.translations?.find((item) => item.locale === locale) ||
    emptyTranslation
  );
}

function hasTranslationContent(value: AdminTranslation) {
  return Boolean(
    value.title.trim() ||
      value.address.trim() ||
      value.shortDescription.trim() ||
      value.description.trim() ||
      value.permittedBusinesses.length,
  );
}

export function ObjectEditor({ object }: { object?: AdminObject }) {
  const router = useRouter();
  const { t } = useLanguage();
  const steps = stepKeys.map(t);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    status: object?.status || "draft",
    type: object?.type || "land",
    district: object?.district || "",
    cadastralNumber: object?.cadastralNumber || "",
    latitude: object?.latitude?.toString() || "",
    longitude: object?.longitude?.toString() || "",
    landAreaHa: object?.landAreaHa?.toString() || "",
    buildingAreaSqm: object?.buildingAreaSqm?.toString() || "",
    usableAreaSqm: object?.usableAreaSqm?.toString() || "",
    investmentAmountUsd: object?.investmentAmountUsd?.toString() || "",
    jobsPlanned: object?.jobsPlanned?.toString() || "",
    auctionUrl: object?.auctionUrl || "",
    sectors: object?.sectors || [],
    uz: translation(object, "uz"),
    ru: translation(object, "ru"),
    media: object?.media || ([] as AdminMedia[]),
  }));
  const publishIssues = useMemo(
    () => {
      const russianStarted = hasTranslationContent(form.ru);
      return [
        !form.uz.title && t("uzbekName"),
        !form.uz.address && t("uzbekAddress"),
        !form.uz.shortDescription && t("shortDescription"),
        !form.uz.description && t("detailedDescription"),
        russianStarted && !form.ru.title && t("russianNameOptional"),
        russianStarted && !form.ru.address && t("russianAddress"),
        russianStarted && !form.ru.shortDescription && t("russianShortDescription"),
        russianStarted && !form.ru.description && t("russianDetailedDescription"),
        !form.district && t("requiredDistrict"),
        !form.cadastralNumber && t("requiredCadastral"),
        !form.latitude && t("latitude"),
        !form.longitude && t("longitude"),
        !form.investmentAmountUsd && t("requiredInvestment"),
        !form.sectors.length && t("requiredSector"),
      ].filter(Boolean);
    },
    [form, t],
  );
  const set = (key: string, value: string | string[]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setTranslation = (
    locale: "uz" | "ru",
    key: keyof AdminTranslation,
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }));
  const submit = async (publish = false) => {
    setSaving(true);
    setError("");
    const payload: AdminObjectPayload = {
      ...form,
      status: publish
        ? form.status === "draft"
          ? "available"
          : form.status
        : "draft",
      latitude: Number(form.latitude) || undefined,
      longitude: Number(form.longitude) || undefined,
      landAreaHa: Number(form.landAreaHa) || undefined,
      buildingAreaSqm: Number(form.buildingAreaSqm) || undefined,
      usableAreaSqm: Number(form.usableAreaSqm) || undefined,
      investmentAmountUsd: Number(form.investmentAmountUsd) || undefined,
      jobsPlanned: Number(form.jobsPlanned) || undefined,
      translations: {
        uz: form.uz,
        ...(hasTranslationContent(form.ru) ? { ru: form.ru } : {}),
      },
    };
    try {
      const saved = object
        ? await adminObjectsApi.update(object.id, payload)
        : await adminObjectsApi.create(payload);
      router.replace(`/dashboard/projects/${saved.id}/edit`);
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };
  return (
    <form className="admin-editor" onSubmit={onSubmit}>
      <header className="admin-page-header">
        <Link className="admin-back" href="/dashboard/projects">
          <ChevronLeft size={16} /> {t("objectsBack")}
        </Link>
        <button className="admin-outline" type="submit" disabled={saving}>
          <Save size={16} /> {t("saveDraft")}
        </button>
      </header>
      <ol className="admin-steps">
        {steps.map((label, index) => (
          <li
            className={index === step ? "active" : index < step ? "done" : ""}
            key={label}
          >
            <button type="button" onClick={() => setStep(index)}>
              <span>{index < step ? <Check size={14} /> : index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      {error && <p className="admin-error">{error}</p>}
      <section className="admin-form-card">
        {step === 0 && (
          <div className="admin-form-grid">
            <Field label={t("objectType")}>
              <select
                value={form.type}
                onChange={(event) => set("type", event.target.value)}
              >
                {["land", "building", "proposal"].map((item) => (
                  <option key={item} value={item}>{t(item as "land" | "building" | "proposal")}</option>
                ))}
              </select>
            </Field>
            <Field label={t("status")}>
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
              >
                {["draft", "available", "auction", "upcoming"].map((item) => (
                  <option key={item} value={item}>{statusMessageKey(item) ? t(statusMessageKey(item)!) : item}</option>
                ))}
              </select>
            </Field>
            <Field label={t("uzbekName")}>
              <input
                value={form.uz.title}
                onChange={(event) =>
                  setTranslation("uz", "title", event.target.value)
                }
              />
            </Field>
            <Field label={t("russianNameOptional")}>
              <input
                value={form.ru.title}
                onChange={(event) =>
                  setTranslation("ru", "title", event.target.value)
                }
              />
            </Field>
            <Field label={t("uzbekAddress")}>
              <input
                value={form.uz.address}
                onChange={(event) =>
                  setTranslation("uz", "address", event.target.value)
                }
              />
            </Field>
            <Field label={t("russianAddress")}>
              <input
                value={form.ru.address}
                onChange={(event) =>
                  setTranslation("ru", "address", event.target.value)
                }
              />
            </Field>
            <Field label={t("district")}>
              <input
                value={form.district}
                onChange={(event) => set("district", event.target.value)}
              />
            </Field>
            <Field wide label={t("shortDescription")}>
              <textarea
                value={form.uz.shortDescription}
                onChange={(event) =>
                  setTranslation("uz", "shortDescription", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("russianShortDescription")}>
              <textarea
                value={form.ru.shortDescription}
                onChange={(event) =>
                  setTranslation("ru", "shortDescription", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("detailedDescription")}>
              <textarea
                value={form.uz.description}
                onChange={(event) =>
                  setTranslation("uz", "description", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("russianDetailedDescription")}>
              <textarea
                value={form.ru.description}
                onChange={(event) =>
                  setTranslation("ru", "description", event.target.value)
                }
              />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="admin-location">
            <div>
              <h2>
                <MapPin size={18} /> {t("mapLocation")}
              </h2>
              <p>
                {t("mapLocationHelp")}
              </p>
            </div>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={({ latitude, longitude }) =>
                setForm((current) => ({ ...current, latitude, longitude }))
              }
            />
            <div className="admin-form-grid">
              <Field label={t("latitude")}>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => set("latitude", event.target.value)}
                />
              </Field>
              <Field label={t("longitude")}>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => set("longitude", event.target.value)}
                />
              </Field>
              <Field wide label={t("cadastralNumber")}>
                <input
                  value={form.cadastralNumber}
                  onChange={(event) =>
                    set("cadastralNumber", event.target.value)
                  }
                />
              </Field>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="admin-form-grid">
            <Field label={t("landArea")}>
              <input
                type="number"
                min="0"
                value={form.landAreaHa}
                onChange={(event) => set("landAreaHa", event.target.value)}
              />
            </Field>
            <Field label={t("buildingArea")}>
              <input
                type="number"
                min="0"
                value={form.buildingAreaSqm}
                onChange={(event) => set("buildingAreaSqm", event.target.value)}
              />
            </Field>
            <Field label={t("investmentUsd")}>
              <input
                type="number"
                min="0"
                value={form.investmentAmountUsd}
                onChange={(event) =>
                  set("investmentAmountUsd", event.target.value)
                }
              />
            </Field>
            <Field label={t("workplace")}>
              <input
                type="number"
                min="0"
                value={form.jobsPlanned}
                onChange={(event) => set("jobsPlanned", event.target.value)}
              />
            </Field>
            <Field wide label={t("sector")}>
              <div className="admin-sector-list">
                {sectors.map((sector) => (
                  <label key={sector}>
                    <input
                      type="checkbox"
                      checked={form.sectors.includes(sector)}
                      onChange={() =>
                        set(
                          "sectors",
                          form.sectors.includes(sector)
                            ? form.sectors.filter((item) => item !== sector)
                            : [...form.sectors, sector],
                        )
                      }
                    />
                    {t(sectorMessageKeys[sector])}
                  </label>
                ))}
              </div>
            </Field>
            {form.status === "auction" && (
              <Field wide label={t("auctionLink")}>
                <input
                  type="url"
                  value={form.auctionUrl}
                  onChange={(event) => set("auctionUrl", event.target.value)}
                />
              </Field>
            )}
          </div>
        )}
        {step === 3 && (
          <MediaStep
            media={form.media}
            onChange={(media) => setForm((current) => ({ ...current, media }))}
          />
        )}{" "}
        {step === 4 && (
          <div className="admin-review">
            <h2>{t("reviewHeading")}</h2>
            <h3>{form.uz.title || t("unnamedObject")}</h3>
            <p>
              {form.district || t("districtNotSelected")} ·{" "}
              {form.landAreaHa || form.buildingAreaSqm || "—"}{" "}
              {form.landAreaHa ? t("hectare") : "m²"}
            </p>
            <p>
              {publishIssues.length
                ? `${t("requiredBeforePublish")} ${publishIssues.join(", ")}.`
                : t("readyToPublish")}
            </p>
          </div>
        )}
      </section>
      <footer className="admin-editor-actions">
        <button
          type="button"
          className="admin-outline"
          disabled={!step}
          onClick={() => setStep((value) => value - 1)}
        >
          <ChevronLeft size={16} /> {t("previous")}
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="admin-primary"
            onClick={() => setStep((value) => value + 1)}
          >
            {t("next")} <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="admin-primary"
            disabled={saving || publishIssues.length > 0}
            onClick={() => void submit(true)}
          >
            <Send size={16} /> {t("publish")}
          </button>
        )}
      </footer>
    </form>
  );
}
function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function MediaStep({
  media,
  onChange,
}: {
  media: AdminMedia[];
  onChange: (media: AdminMedia[]) => void;
}) {
  const { t } = useLanguage();
  const add = () => onChange([...media, { kind: "image", url: "", title: "" }]);
  return (
    <div className="admin-media">
      <div>
        <h2>{t("mediaLinks")}</h2>
        <p>{t("mediaHelp")}</p>
      </div>
      {media.map((item, index) => (
        <div className="admin-media-row" key={index}>
          <select
            value={item.kind}
            onChange={(event) =>
              onChange(
                media.map((value, position) =>
                  position === index
                    ? {
                        ...value,
                        kind: event.target.value as AdminMedia["kind"],
                      }
                    : value,
                ),
              )
            }
          >
            <option value="image">{t("photo")}</option>
            <option value="video">{t("video")}</option>
            <option value="document">{t("document")}</option>
            <option value="virtual_tour">{t("virtualTour")}</option>
          </select>
          <input
            type="url"
            placeholder="https://…"
            value={item.url}
            onChange={(event) =>
              onChange(
                media.map((value, position) =>
                  position === index
                    ? { ...value, url: event.target.value }
                    : value,
                ),
              )
            }
          />
          <button
            type="button"
            onClick={() =>
              onChange(media.filter((_, position) => position !== index))
            }
          >
            {t("remove")}
          </button>
        </div>
      ))}
      <button type="button" className="admin-outline" onClick={add}>
        + {t("addMedia")}
      </button>
    </div>
  );
}
