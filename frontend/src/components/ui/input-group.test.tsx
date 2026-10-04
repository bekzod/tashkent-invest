import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Trash2 } from "lucide-react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";

afterEach(cleanup);

describe("InputGroup", () => {
  test("presents related controls in one accessible shell", () => {
    const onRemove = vi.fn();

    render(
      <InputGroup aria-invalid="true">
        <InputGroupInput aria-label="Media URL" />
        <InputGroupButton aria-label="Remove media" onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </InputGroupButton>
      </InputGroup>,
    );

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-slot", "input-group");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Media URL" })).toHaveAttribute(
      "data-slot",
      "input-group-control",
    );
    expect(screen.getByRole("button", { name: "Remove media" })).toHaveAttribute(
      "data-slot",
      "input-group-button",
    );
  });
});
