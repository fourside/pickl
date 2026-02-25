import { Link } from "react-router";
import { LockIcon, TrashIcon } from "../../shared/components/icons";
import type { ListItem } from "./api";
import styles from "./lists.module.css";

interface ListCardProps {
  list: ListItem;
  currentUserId?: string;
  onDeleteClick?: (listId: string) => void;
}

export function ListCard({
  list,
  currentUserId,
  onDeleteClick,
}: ListCardProps) {
  const isCreator = list.createdBy === currentUserId;

  return (
    <Link to={`/lists/${list.id}`} className={styles.card}>
      <span className={styles.cardName}>
        {list.name}
        {list.isPrivate && (
          <span className={styles.lockIcon}>
            <LockIcon />
          </span>
        )}
      </span>
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
      {isCreator && onDeleteClick && (
        <button
          type="button"
          className={styles.deleteListButton}
          aria-label="Delete list"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick(list.id);
          }}
        >
          <TrashIcon />
        </button>
      )}
      <span
        className={`${styles.badge} ${!list.isParticipant ? styles.badgeInactive : ""}`}
      >
        {list.isParticipant ? "Joined" : "View"}
      </span>
    </Link>
  );
}
