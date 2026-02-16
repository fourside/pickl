import { BrowserRouter, Route, Routes } from "react-router";
import { LoginPage } from "./features/auth/page";
import { ListDetailPage } from "./features/list-detail/page";
import { ListsPage } from "./features/lists/page";
import { SettingsPage } from "./features/settings/page";
import { AuthProvider } from "./shared/auth/auth-context";
import { AuthGuard } from "./shared/auth/auth-guard";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<ListsPage />} />
            <Route path="/lists/:id" element={<ListDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
