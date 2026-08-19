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

const steps = ["Asosiy", "Joylashuv", "Shartlar", "Media", "Ko‘rib chiqish"];
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

export function ObjectEditor({ object }: { object?: AdminObject }) {
  const router = useRouter();
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
    () =>
      [
        !form.uz.title && "O‘zbekcha nom",
        !form.district && "tuman",
        !form.cadastralNumber && "kadastr",
        !form.latitude && "latitude",
        !form.longitude && "longitude",
        !form.investmentAmountUsd && "investitsiya hajmi",
        !form.sectors.length && "soha",
      ].filter(Boolean),
    [form],
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
      translations: { uz: form.uz, ...(form.ru.title ? { ru: form.ru } : {}) },
    };
    try {
      const saved = object
        ? await adminObjectsApi.update(object.id, payload)
        : await adminObjectsApi.create(payload);
      router.replace(`/dashboard/projects/${saved.id}/edit`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Saqlashda xatolik");
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
          <ChevronLeft size={16} /> Obyektlar
        </Link>
        <button className="admin-outline" type="submit" disabled={saving}>
          <Save size={16} /> Qoralama saqlash
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
            <Field label="Obyekt turi">
              <select
                value={form.type}
                onChange={(event) => set("type", event.target.value)}
              >
                {["land", "building", "proposal"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
              >
                {["draft", "available", "auction", "upcoming"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="O‘zbekcha nom">
              <input
                value={form.uz.title}
                onChange={(event) =>
                  setTranslation("uz", "title", event.target.value)
                }
              />
            </Field>
            <Field label="Ruscha nom (ixtiyoriy)">
              <input
                value={form.ru.title}
                onChange={(event) =>
                  setTranslation("ru", "title", event.target.value)
                }
              />
            </Field>
            <Field label="O‘zbekcha manzil">
              <input
                value={form.uz.address}
                onChange={(event) =>
                  setTranslation("uz", "address", event.target.value)
                }
              />
            </Field>
            <Field label="Tuman">
              <input
                value={form.district}
                onChange={(event) => set("district", event.target.value)}
              />
            </Field>
            <Field wide label="Qisqa tavsif">
              <textarea
                value={form.uz.shortDescription}
                onChange={(event) =>
                  setTranslation("uz", "shortDescription", event.target.value)
                }
              />
            </Field>
            <Field wide label="Batafsil tavsif">
              <textarea
                value={form.uz.description}
                onChange={(event) =>
                  setTranslation("uz", "description", event.target.value)
                }
              />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="admin-location">
            <div>
              <h2>
                <MapPin size={18} /> Xarita joylashuvi
              </h2>
              <p>
                Nuqtani xaritada bosing yoki koordinatani qo‘lda kiriting.
                Marker darhol ko‘rinadi.
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
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => set("latitude", event.target.value)}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => set("longitude", event.target.value)}
                />
              </Field>
              <Field wide label="Kadastr raqami">
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
            <Field label="Yer maydoni, ga">
              <input
                type="number"
                min="0"
                value={form.landAreaHa}
                onChange={(event) => set("landAreaHa", event.target.value)}
              />
            </Field>
            <Field label="Bino maydoni, m²">
              <input
                type="number"
                min="0"
                value={form.buildingAreaSqm}
                onChange={(event) => set("buildingAreaSqm", event.target.value)}
              />
            </Field>
            <Field label="Investitsiya, USD">
              <input
                type="number"
                min="0"
                value={form.investmentAmountUsd}
                onChange={(event) =>
                  set("investmentAmountUsd", event.target.value)
                }
              />
            </Field>
            <Field label="Ish o‘rni">
              <input
                type="number"
                min="0"
                value={form.jobsPlanned}
                onChange={(event) => set("jobsPlanned", event.target.value)}
              />
            </Field>
            <Field wide label="Soha">
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
                    {sector}
                  </label>
                ))}
              </div>
            </Field>
            {form.status === "auction" && (
              <Field wide label="E-auksion havolasi">
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
            <h2>Investor ko‘radigan ma’lumot</h2>
            <h3>{form.uz.title || "Nomsiz obyekt"}</h3>
            <p>
              {form.district || "Tuman tanlanmagan"} ·{" "}
              {form.landAreaHa || form.buildingAreaSqm || "—"}{" "}
              {form.landAreaHa ? "ga" : "m²"}
            </p>
            <p>
              {publishIssues.length
                ? `Nashr qilishdan oldin: ${publishIssues.join(", ")} kiritilishi kerak.`
                : "Obyekt nashr qilishga tayyor."}
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
          <ChevronLeft size={16} /> Oldingi
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="admin-primary"
            onClick={() => setStep((value) => value + 1)}
          >
            Keyingi <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="admin-primary"
            disabled={saving || publishIssues.length > 0}
            onClick={() => void submit(true)}
          >
            <Send size={16} /> Nashr qilish
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
  const add = () => onChange([...media, { kind: "image", url: "", title: "" }]);
  return (
    <div className="admin-media">
      <div>
        <h2>Media havolalari</h2>
        <p>
          Foto, video, PDF yoki 2:1 equirectangular 360° panorama uchun HTTPS
          havola kiriting.
        </p>
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
            <option value="image">Foto</option>
            <option value="video">Video</option>
            <option value="document">Hujjat</option>
            <option value="virtual_tour">360° panorama</option>
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
            Olib tashlash
          </button>
        </div>
      ))}
      <button type="button" className="admin-outline" onClick={add}>
        + Media qo‘shish
      </button>
    </div>
  );
}
