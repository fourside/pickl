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

export async function uploadAvatar(blob: Blob): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/avatar", {
    method: "PUT",
    headers: {
      "Content-Type": blob.type,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: blob,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}
