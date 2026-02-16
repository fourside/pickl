import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputBar } from "./input-bar";

describe("InputBar", () => {
  it("displays the placeholder", () => {
    render(<InputBar placeholder="Add item..." onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText("Add item...")).toBeInTheDocument();
  });

  it("calls onSubmit with trimmed value on Enter", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InputBar onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "  Milk  {Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Milk");
  });

  it("clears input after submit", async () => {
    const user = userEvent.setup();
    render(<InputBar onSubmit={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "Milk{Enter}");

    expect(input).toHaveValue("");
  });

  it("does not call onSubmit with empty or whitespace-only input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InputBar onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "   {Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    render(<InputBar onSubmit={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
