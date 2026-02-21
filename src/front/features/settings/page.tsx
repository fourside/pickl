import { Switch } from "@base-ui/react/switch";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../shared/auth/auth-context";
import { useTheme } from "../../shared/theme/theme-context";
import { changePassword } from "./api";
import styles from "./settings.module.css";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          &larr;
        </Link>
        <h1>Settings</h1>
      </div>

      <div className={styles.section}>
        <p className={styles.userInfo}>
          {user?.name} ({user?.email})
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.themeRow}>
          <span>Dark mode</span>
          <Switch.Root
            className={styles.switch}
            checked={isDark}
            onCheckedChange={toggleDark}
          >
            <Switch.Thumb className={styles.switchThumb} />
          </Switch.Root>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Change Password</h2>
        <form className={styles.form} onSubmit={handleChangePassword}>
          <div className={styles.field}>
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="new-password">New Password (8+ chars)</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSubmitting}
          >
            Change Password
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
