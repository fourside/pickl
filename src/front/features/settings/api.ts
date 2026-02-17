import { apiFetch, setToken } from "../../shared/api/client";

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await apiFetch<{ token: string }>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  setToken(res.token);
}
