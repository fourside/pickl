import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ItemData } from "./api";
import { ItemRow } from "./item-row";

interface SortableItemProps {
  item: ItemData;
  isParticipant: boolean;
  onCheck: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function SortableItem({
  item,
  isParticipant,
  onCheck,
  onDelete,
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
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ItemRow
        item={item}
        isParticipant={isParticipant}
        onCheck={onCheck}
        onDelete={onDelete}
      />
    </div>
  );
}
