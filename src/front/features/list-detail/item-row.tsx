import { TrashIcon } from "../../shared/components/icons";
import type { ItemData } from "./api";
import styles from "./list-detail.module.css";

interface ItemRowProps {
  item: ItemData;
  isParticipant: boolean;
  onCheck: (itemId: string, checked: boolean) => void;
  onDelete?: (itemId: string) => void;
}

export function ItemRow({
  item,
  isParticipant,
  onCheck,
  onDelete,
}: ItemRowProps) {
  return (
    <div className={styles.item}>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onCheck(item.id, !item.checked)}
        disabled={!isParticipant}
        aria-label={`${item.checked ? "Uncheck" : "Check"} ${item.text}`}
      />
      <span className={item.checked ? styles.checked : ""}>{item.text}</span>
      {isParticipant && onDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${item.text}`}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
