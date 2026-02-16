import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import useSWR from "swr";
import { swrFetcher } from "../../shared/api/client";
import { InputBar } from "../../shared/components/input-bar";
import type { ListItem } from "../lists/api";
import type { ItemData } from "./api";
import {
  createItem,
  deleteCheckedItems,
  deleteItem,
  joinList,
  reorderItems,
  updateItem,
} from "./api";
import { ItemRow } from "./item-row";
import styles from "./list-detail.module.css";
import { SortableItem } from "./sortable-item";

export function ListDetailPage() {
  const { id: listId } = useParams<{ id: string }>();
  const [isDragging, setIsDragging] = useState(false);

  const { data: lists, mutate: mutateLists } = useSWR<ListItem[]>(
    "/lists",
    swrFetcher,
    { refreshInterval: isDragging ? 0 : 3000 },
  );

  const { data: items, mutate: mutateItems } = useSWR<ItemData[]>(
    listId ? `/items/${listId}` : null,
    swrFetcher,
    { refreshInterval: isDragging ? 0 : 3000 },
  );

  const list = lists?.find((l) => l.id === listId);
  const isParticipant = list?.isParticipant ?? false;

  const uncheckedItems = items?.filter((item) => !item.checked) ?? [];
  const checkedItems = items?.filter((item) => item.checked) ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleAddItem = useCallback(
    async (text: string) => {
      if (!listId) return;
      const newItem = await createItem(listId, text);
      mutateItems((prev) => [...(prev ?? []), newItem], false);
    },
    [listId, mutateItems],
  );

  const handleCheck = useCallback(
    async (itemId: string, checked: boolean) => {
      if (!listId) return;
      mutateItems(
        (prev) =>
          prev?.map((item) =>
            item.id === itemId ? { ...item, checked } : item,
          ),
        false,
      );
      await updateItem(listId, itemId, { checked });
      mutateItems();
    },
    [listId, mutateItems],
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!listId) return;
      mutateItems((prev) => prev?.filter((item) => item.id !== itemId), false);
      await deleteItem(listId, itemId);
    },
    [listId, mutateItems],
  );

  const handleClearChecked = useCallback(async () => {
    if (!listId) return;
    mutateItems((prev) => prev?.filter((item) => !item.checked), false);
    await deleteCheckedItems(listId);
  }, [listId, mutateItems]);

  const handleJoin = useCallback(async () => {
    if (!listId) return;
    await joinList(listId);
    mutateLists();
  }, [listId, mutateLists]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setIsDragging(false);
      const { active, over } = event;
      if (!over || active.id === over.id || !listId) return;

      const oldIndex = uncheckedItems.findIndex((i) => i.id === active.id);
      const newIndex = uncheckedItems.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(uncheckedItems, oldIndex, newIndex);
      const newItems = [...reordered, ...checkedItems];

      mutateItems(newItems, false);
      await reorderItems(
        listId,
        reordered.map((i) => i.id),
      );
      mutateItems();
    },
    [listId, uncheckedItems, checkedItems, mutateItems],
  );

  if (!listId) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          &larr;
        </Link>
        <h1>{list?.name ?? "..."}</h1>
      </div>

      {!isParticipant && (
        <div className={styles.joinBanner}>
          <span>View only</span>
          <button
            type="button"
            className={styles.joinButton}
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
      )}

      {isParticipant && (
        <div className={styles.inputWrapper}>
          <InputBar placeholder="Add item..." onSubmit={handleAddItem} />
        </div>
      )}

      <div className={styles.section}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={uncheckedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.itemList}>
              {uncheckedItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  isParticipant={isParticipant}
                  onCheck={handleCheck}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {checkedItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Done</span>
            {isParticipant && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearChecked}
              >
                Clear
              </button>
            )}
          </div>
          <div className={styles.itemList}>
            {checkedItems.map((item) => (
              <div key={item.id}>
                <ItemRow
                  item={item}
                  isParticipant={isParticipant}
                  onCheck={handleCheck}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {items && items.length === 0 && (
        <p className={styles.empty}>No items yet</p>
      )}
    </div>
  );
}
