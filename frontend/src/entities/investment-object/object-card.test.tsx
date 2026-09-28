import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { ObjectCard } from "./object-card";
import type { InvestmentObject } from "./types";

const object: InvestmentObject = {
  id: "map-keyboard-object",
  slug: "map-keyboard-object",
  title: "Klaviatura obyekti",
  shortDescription: "Sinov obyekti",
  address: "Toshkent tumani",
  district: "Toshkent tumani",
  type: "land",
  status: "available",
  investmentAmountUsd: 1000,
};

describe("ObjectCard map selection", () => {
  test("can be selected with Enter or Space without hijacking its detail link", () => {
    const onSelect = vi.fn();
    render(
      <LanguageProvider initialLocale="uz">
        <ObjectCard object={object} onSelect={onSelect} />
      </LanguageProvider>,
    );

    const card = screen.getByTestId("map-result-card");
    expect(card).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(screen.getByRole("link", { name: /batafsil/i }), {
      key: "Enter",
    });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
