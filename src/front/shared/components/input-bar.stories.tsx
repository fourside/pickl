import type { Story } from "@ladle/react";
import { InputBar } from "./input-bar";

export const Default: Story = () => (
  <InputBar onSubmit={(v) => console.log("submit:", v)} />
);

export const WithPlaceholder: Story = () => (
  <InputBar
    placeholder="Add item..."
    onSubmit={(v) => console.log("submit:", v)}
  />
);

export const Disabled: Story = () => (
  <InputBar
    placeholder="Disabled"
    onSubmit={(v) => console.log("submit:", v)}
    disabled
  />
);
