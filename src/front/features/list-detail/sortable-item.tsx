import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ItemData } from "./api";
import { ItemRow } from "./item-row";
import { SwipeableItemRow } from "./swipeable-item-row";

interface SortableItemProps {
  item: ItemData;
  isParticipant: boolean;
  isTouchDevice: boolean;
  className?: string;
  isRevealed: boolean;
  onCheck: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
  onReveal: (itemId: string | null) => void;
}

export function SortableItem({
  item,
  isParticipant,
  isTouchDevice,
  className,
  isRevealed,
  onCheck,
  onDelete,
  onReveal,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...attributes}
      {...listeners}
    >
      {isTouchDevice ? (
        <SwipeableItemRow
          item={item}
          isParticipant={isParticipant}
          isRevealed={isRevealed}
          onCheck={onCheck}
          onDelete={onDelete}
          onReveal={onReveal}
        />
      ) : (
        <ItemRow
          item={item}
          isParticipant={isParticipant}
          onCheck={onCheck}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
