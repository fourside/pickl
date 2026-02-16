import type { Story } from "@ladle/react";
import { LoginPage } from "./page";

export default {
  title: "auth/page",
};

export const Default: Story = () => {
  // Clear auth to show login form
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return <LoginPage />;
};
