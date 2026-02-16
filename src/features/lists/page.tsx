import { Link } from "react-router";
import useSWR from "swr";
import { swrFetcher } from "../../shared/api/client";
import { InputBar } from "../../shared/components/input-bar";
import type { ListItem } from "./api";
import { createList } from "./api";
import { ListCard } from "./list-card";
import styles from "./lists.module.css";

export function ListsPage() {
  const { data: lists, mutate } = useSWR<ListItem[]>("/lists", swrFetcher, {
    refreshInterval: 3000,
  });

  const handleCreate = async (name: string) => {
    const newList = await createList(name);
    mutate((prev) => [newList, ...(prev ?? [])], false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Pickl</h1>
        <Link to="/settings" className={styles.settingsLink}>
          Settings
        </Link>
      </div>

      <div className={styles.inputWrapper}>
        <InputBar placeholder="New list..." onSubmit={handleCreate} />
      </div>

      <div className={styles.listGrid}>
        {lists?.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
        {lists && lists.length === 0 && (
          <p className={styles.empty}>No lists yet</p>
        )}
      </div>
    </div>
  );
}
