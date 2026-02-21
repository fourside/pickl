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
      <div className={styles.cardAvatars}>
        {list.participants.map((p) =>
          p.avatarUrl ? (
            <img
              key={p.id}
              src={p.avatarUrl}
              alt={p.name}
              className={styles.cardAvatar}
            />
          ) : (
            <span key={p.id} className={styles.cardAvatarPlaceholder}>
              {p.name.charAt(0).toUpperCase()}
            </span>
          ),
        )}
      </div>
      <span
        className={`${styles.badge} ${!list.isParticipant ? styles.badgeInactive : ""}`}
      >
        {list.isParticipant ? "Joined" : "View"}
      </span>
    </Link>
  );
}
