import { TrashIcon } from "../../shared/components/icons";
import type { ItemData } from "./api";
import { ItemRow } from "./item-row";
import styles from "./list-detail.module.css";
import { useSwipeToReveal } from "./use-swipe-to-reveal";

interface SwipeableItemRowProps {
  item: ItemData;
  isParticipant: boolean;
  isRevealed: boolean;
  onCheck: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
  onReveal: (itemId: string | null) => void;
}

export function SwipeableItemRow({
  item,
  isParticipant,
  isRevealed,
  onCheck,
  onDelete,
  onReveal,
}: SwipeableItemRowProps) {
  const { containerRef, contentRef } = useSwipeToReveal({
    isRevealed,
    onReveal: (revealed) => onReveal(revealed ? item.id : null),
    disabled: !isParticipant,
  });

  const handleDelete = () => {
    onReveal(null);
    onDelete(item.id);
  };

  return (
    <div className={styles.swipeContainer} ref={containerRef}>
      {isParticipant && (
        <button
          type="button"
          className={styles.swipeDeleteAction}
          onClick={handleDelete}
          aria-label={`Delete ${item.text}`}
          tabIndex={isRevealed ? 0 : -1}
        >
          <TrashIcon />
        </button>
      )}
      <div className={styles.swipeContent} ref={contentRef}>
        <ItemRow item={item} isParticipant={isParticipant} onCheck={onCheck} />
      </div>
    </div>
  );
}
