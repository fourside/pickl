import { apiFetch } from "../../shared/api/client";

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
