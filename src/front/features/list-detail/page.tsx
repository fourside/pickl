import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Menu } from "@base-ui/react/menu";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import useSWR from "swr";
import { swrFetcher } from "../../shared/api/client";
import {
  ArrowLeftIcon,
  ClockIcon,
  MoreVerticalIcon,
  SortAZIcon,
} from "../../shared/components/icons";
import { InputBar } from "../../shared/components/input-bar";
import type { ListItem } from "../lists/api";
import type { ItemData } from "./api";
import {
  createItem,
  deleteItem,
  joinList,
  leaveList,
  reorderItems,
  updateItem,
  updateListAutoHide,
  updateListName,
} from "./api";
import { ItemRow } from "./item-row";
import styles from "./list-detail.module.css";
import { SortableItem } from "./sortable-item";
import { SwipeableItemRow } from "./swipeable-item-row";
import { useIsTouchDevice } from "./use-is-touch-device";

const DONE_SORT_ORDER_KEY = "done-sort-order";
type DoneSortOrder = "newest" | "alphabetical";

function getStoredDoneSortOrder(): DoneSortOrder {
  const stored = localStorage.getItem(DONE_SORT_ORDER_KEY);
  if (stored === "newest" || stored === "alphabetical") {
    return stored;
  }
  return "newest";
}

export function ListDetailPage() {
  const { id: listId } = useParams<{ id: string }>();
  const isTouchDevice = useIsTouchDevice();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [revealedItemId, setRevealedItemId] = useState<string | null>(null);
  const [doneSortOrder, setDoneSortOrder] = useState<DoneSortOrder>(
    getStoredDoneSortOrder,
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastAddedIdRef = useRef<string | null>(null);
  const lastCheckedIdRef = useRef<string | null>(null);

  const { data: lists, mutate: mutateLists } = useSWR<ListItem[]>(
    "/lists",
    swrFetcher,
    { refreshInterval: isDragging ? 0 : 30000 },
  );

  const { data: items, mutate: mutateItems } = useSWR<ItemData[]>(
    listId ? `/items/${listId}` : null,
    swrFetcher,
    { refreshInterval: isDragging ? 0 : 30000 },
  );

  const list = lists?.find((l) => l.id === listId);
  const isParticipant = list?.isParticipant ?? false;

  const uncheckedItems = items?.filter((item) => !item.checked) ?? [];
  const checkedItems = useMemo(() => {
    const checked = items?.filter((item) => item.checked) ?? [];
    if (doneSortOrder === "alphabetical") {
      return [...checked].sort((a, b) => a.text.localeCompare(b.text));
    }
    return [...checked].sort((a, b) => {
      const aTime = a.checkedAt ?? "";
      const bTime = b.checkedAt ?? "";
      return bTime.localeCompare(aTime);
    });
  }, [items, doneSortOrder]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleAddItem = useCallback(
    async (text: string) => {
      if (!listId) return;
      const newItem = await createItem(listId, text);
      lastAddedIdRef.current = newItem.id;
      mutateItems((prev) => [newItem, ...(prev ?? [])], false);
    },
    [listId, mutateItems],
  );

  const handleCheck = useCallback(
    async (itemId: string, checked: boolean) => {
      if (!listId) return;
      if (checked) {
        lastCheckedIdRef.current = itemId;
      }
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

  const handleJoin = useCallback(async () => {
    if (!listId) return;
    await joinList(listId);
    mutateLists();
  }, [listId, mutateLists]);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const handleLeave = useCallback(async () => {
    if (!listId) return;
    await leaveList(listId);
    setLeaveOpen(false);
    mutateLists();
  }, [listId, mutateLists]);

  const handleStartEditName = useCallback(() => {
    if (!list || !isParticipant) return;
    setEditName(list.name);
    setIsEditingName(true);
    requestAnimationFrame(() => nameInputRef.current?.select());
  }, [list, isParticipant]);

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!listId || !trimmed || trimmed === list?.name) {
      setIsEditingName(false);
      return;
    }
    mutateLists(
      (prev) =>
        prev?.map((l) => (l.id === listId ? { ...l, name: trimmed } : l)),
      false,
    );
    setIsEditingName(false);
    await updateListName(listId, trimmed);
    mutateLists();
  }, [listId, editName, list?.name, mutateLists]);

  const handleToggleAutoHide = useCallback(
    async (checked: boolean) => {
      if (!listId) return;
      mutateLists(
        (prev) =>
          prev?.map((l) =>
            l.id === listId ? { ...l, autoHideDone: checked } : l,
          ),
        false,
      );
      await updateListAutoHide(listId, checked);
      mutateLists();
      mutateItems();
    },
    [listId, mutateLists, mutateItems],
  );

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
        <Link to="/" className={styles.backLink} aria-label="Back">
          <ArrowLeftIcon />
        </Link>
        {isEditingName ? (
          <input
            ref={nameInputRef}
            className={styles.nameInput}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") setIsEditingName(false);
            }}
          />
        ) : (
          <h1
            onClick={isParticipant ? handleStartEditName : undefined}
            onKeyDown={
              isParticipant
                ? (e) => {
                    if (e.key === "Enter") handleStartEditName();
                  }
                : undefined
            }
            className={isParticipant ? styles.editableName : undefined}
          >
            {list?.name ?? "..."}
          </h1>
        )}
        <div className={styles.headerAvatars}>
          {list?.participants.map((p) =>
            p.avatarUrl ? (
              <img
                key={p.id}
                src={p.avatarUrl}
                alt={p.name}
                className={styles.headerAvatar}
              />
            ) : (
              <span key={p.id} className={styles.headerAvatarPlaceholder}>
                {p.name.charAt(0).toUpperCase()}
              </span>
            ),
          )}
        </div>
        {isParticipant && (
          <>
            <Menu.Root>
              <Menu.Trigger
                className={styles.menuTrigger}
                aria-label="List settings"
              >
                <MoreVerticalIcon />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="end"
                  sideOffset={4}
                  positionMethod="fixed"
                  className={styles.menuPositioner}
                >
                  <Menu.Popup className={styles.menuPopup}>
                    <Menu.CheckboxItem
                      className={styles.menuCheckboxItem}
                      checked={list?.autoHideDone ?? true}
                      onCheckedChange={handleToggleAutoHide}
                      closeOnClick={false}
                    >
                      <Menu.CheckboxItemIndicator
                        className={styles.menuItemIndicator}
                      />
                      Auto-hide after 48h
                    </Menu.CheckboxItem>
                    <Menu.Item
                      className={styles.menuItemDanger}
                      onClick={() => setLeaveOpen(true)}
                    >
                      Leave list
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <AlertDialog.Root open={leaveOpen} onOpenChange={setLeaveOpen}>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop className={styles.alertBackdrop} />
                <AlertDialog.Popup className={styles.alertPopup}>
                  <AlertDialog.Title className={styles.alertTitle}>
                    Leave this list?
                  </AlertDialog.Title>
                  <div className={styles.alertActions}>
                    <AlertDialog.Close className={styles.alertCancel}>
                      Cancel
                    </AlertDialog.Close>
                    <button
                      type="button"
                      className={styles.alertDanger}
                      onClick={handleLeave}
                    >
                      Leave
                    </button>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </>
        )}
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
          onDragStart={() => {
            setIsDragging(true);
            setRevealedItemId(null);
          }}
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
                  isTouchDevice={isTouchDevice}
                  isRevealed={revealedItemId === item.id}
                  className={
                    item.id === lastAddedIdRef.current
                      ? styles.slideIn
                      : undefined
                  }
                  onCheck={handleCheck}
                  onDelete={handleDelete}
                  onReveal={setRevealedItemId}
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
            <div className={styles.sortButtons}>
              <button
                type="button"
                className={
                  doneSortOrder === "newest"
                    ? styles.sortButtonActive
                    : styles.sortButton
                }
                onClick={() => {
                  setDoneSortOrder("newest");
                  localStorage.setItem(DONE_SORT_ORDER_KEY, "newest");
                }}
                aria-label="Sort by newest"
                title="Sort by newest"
              >
                <ClockIcon />
              </button>
              <button
                type="button"
                className={
                  doneSortOrder === "alphabetical"
                    ? styles.sortButtonActive
                    : styles.sortButton
                }
                onClick={() => {
                  setDoneSortOrder("alphabetical");
                  localStorage.setItem(DONE_SORT_ORDER_KEY, "alphabetical");
                }}
                aria-label="Sort alphabetically"
                title="Sort alphabetically"
              >
                <SortAZIcon />
              </button>
            </div>
          </div>
          <div className={styles.itemList}>
            {checkedItems.map((item) => (
              <div
                key={item.id}
                className={
                  item.id === lastCheckedIdRef.current
                    ? styles.fadeIn
                    : undefined
                }
              >
                {isTouchDevice ? (
                  <SwipeableItemRow
                    item={item}
                    isParticipant={isParticipant}
                    isRevealed={revealedItemId === item.id}
                    onCheck={handleCheck}
                    onDelete={handleDelete}
                    onReveal={setRevealedItemId}
                  />
                ) : (
                  <ItemRow
                    item={item}
                    isParticipant={isParticipant}
                    onCheck={handleCheck}
                    onDelete={handleDelete}
                  />
                )}
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
