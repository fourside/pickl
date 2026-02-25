import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import useSWR from "swr";
import { swrFetcher } from "../../shared/api/client";
import { useAuth } from "../../shared/auth/auth-context";
import { InputBar } from "../../shared/components/input-bar";
import type { ListItem } from "./api";
import { createList, deleteList } from "./api";
import { ListCard } from "./list-card";
import styles from "./lists.module.css";

export function ListsPage() {
  const { user } = useAuth();
  const { data: lists, mutate } = useSWR<ListItem[]>("/lists", swrFetcher, {
    refreshInterval: 30000,
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = async (name: string) => {
    const newList = await createList(name);
    mutate((prev) => [newList, ...(prev ?? [])], false);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget;
    mutate((prev) => prev?.filter((l) => l.id !== targetId), false);
    setDeleteTarget(null);
    await deleteList(targetId);
    mutate();
  }, [deleteTarget, mutate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Pickl</h1>
        <Link
          to="/settings"
          className={styles.avatarLink}
          aria-label="Settings"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarPlaceholder}>
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          )}
        </Link>
      </div>

      <div className={styles.inputWrapper}>
        <InputBar placeholder="New list..." onSubmit={handleCreate} />
      </div>

      <div className={styles.listGrid}>
        {lists?.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            currentUserId={user?.id}
            onDeleteClick={setDeleteTarget}
          />
        ))}
        {lists && lists.length === 0 && (
          <p className={styles.empty}>No lists yet</p>
        )}
      </div>

      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.alertBackdrop} />
          <AlertDialog.Popup className={styles.alertPopup}>
            <AlertDialog.Title className={styles.alertTitle}>
              Delete this list?
            </AlertDialog.Title>
            <div className={styles.alertActions}>
              <AlertDialog.Close className={styles.alertCancel}>
                Cancel
              </AlertDialog.Close>
              <button
                type="button"
                className={styles.alertDanger}
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
