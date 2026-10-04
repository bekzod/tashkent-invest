import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Trash2 } from "lucide-react";
import { ActionIconButton } from "./action-icon-button";

afterEach(cleanup);

test("keeps icon-only actions accessible and clickable", () => {
  const onClick = vi.fn();

  render(
    <ActionIconButton label="Olib tashlash" onClick={onClick}>
      <Trash2 aria-hidden="true" />
    </ActionIconButton>,
  );

  const button = screen.getByRole("button", { name: "Olib tashlash" });
  expect(button).toHaveAttribute("data-icon-action");
  expect(button).not.toHaveTextContent("Olib tashlash");

  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});
