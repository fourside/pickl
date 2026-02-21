import { Switch } from "@base-ui/react/switch";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../shared/auth/auth-context";
import { LockIcon, MoonIcon } from "../../shared/components/icons";
import { useTheme } from "../../shared/theme/theme-context";
import { changePassword, uploadAvatar } from "./api";
import { AvatarCropper } from "./avatar-cropper";
import styles from "./settings.module.css";

export function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const handleCrop = useCallback(
    async (blob: Blob) => {
      setCropSrc(null);
      setIsUploading(true);
      try {
        await uploadAvatar(blob);
        const newUrl = `/api/avatar/${user?.id}?t=${Date.now()}`;
        updateUser({ avatarUrl: newUrl });
        setAvatarUrl(newUrl);
      } catch {
        // upload failed — keep current avatar display
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, updateUser],
  );

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
        <div className={styles.avatarSection}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarPlaceholder}>
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            )}
          </button>
          <div>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            hidden
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.themeRow}>
          <MoonIcon />
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
        <h2 className={styles.sectionTitle}>
          <LockIcon />
          Change Password
        </h2>
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

      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onCrop={handleCrop}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
