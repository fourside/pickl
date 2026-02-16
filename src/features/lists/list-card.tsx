import { Link } from "react-router";
import type { ListItem } from "./api";
import styles from "./lists.module.css";

interface ListCardProps {
  list: ListItem;
}

export function ListCard({ list }: ListCardProps) {
  return (
    <Link to={`/lists/${list.id}`} className={styles.card}>
      <span className={styles.cardName}>{list.name}</span>
      <span
        className={`${styles.badge} ${!list.isParticipant ? styles.badgeInactive : ""}`}
      >
        {list.isParticipant ? "Joined" : "View"}
      </span>
    </Link>
  );
}
