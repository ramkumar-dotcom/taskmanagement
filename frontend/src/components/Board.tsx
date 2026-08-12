"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import type { BoardPageData, CreateTaskRequest, Task, TaskLabel, TaskPriority } from "@tmb/shared";
import {
  createBoard,
  createColumn,
  createTask,
  deleteTask,
  duplicateBoard,
  duplicateTask,
  getBoard,
  listBoards,
  updateColumn,
  updateTask,
} from "@/lib/api";
import { readSelectedBoardId, readUser, saveSelectedBoardId } from "@/lib/auth";
import { isInProgressColumnName } from "@/lib/columns";
import { taskMatchesDateFilter, type DateFilterField } from "@/lib/dates";
import { taskMatchesSearch } from "@/lib/labels";
import {
  boardCollision,
  columnSortId,
  dropIndex,
  findTask,
  moveColumn,
  moveTask,
  parseColumnSortId,
  parseTaskDragId,
} from "@/lib/dnd";
import type { TaskSort } from "@/lib/priority";
import { errorMessage } from "@/lib/parse";
import { BOARD_VIEWS, taskMatchesView, type BoardView } from "@/lib/views";
import { DEFAULT_WIP_LIMIT, readWipLimit, saveWipLimit } from "@/lib/wip";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import AddColumnCard from "./AddColumnCard";
import AddTaskForm from "./AddTaskForm";
import BoardSwitcher from "./BoardSwitcher";
import Column from "./Column";
import DateRangeFilter from "./DateRangeFilter";
import { TaskCardFace } from "./TaskCard";

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.3" } },
  }),
};

interface BoardProps {
  initial: BoardPageData;
}

export default function Board({ initial }: BoardProps) {
  const [board, setBoard] = useState(initial.board);
  const [boards, setBoards] = useState<{ id: number; name: string; created_at: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState(initial.error);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState<DateFilterField>("column");
  const [sort, setSort] = useState<TaskSort>("board");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<BoardView>("all");
  const [wipLimit, setWipLimit] = useState(DEFAULT_WIP_LIMIT);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const boardRef = useRef(board);
  const dragOrigin = useRef<{ columnId: number; position: number } | null>(null);
  const columnDrag = useRef<{ id: number; from: number } | null>(null);
  boardRef.current = board;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  useEffect(() => {
    setWipLimit(readWipLimit());
    void load();
  }, []);

  async function load(): Promise<void> {
    const user = readUser();
    if (!user) {
      setError("You need to log in.");
      return;
    }
    try {
      const listed = await listBoards(user.id);
      setBoards(listed);
      const preferred = readSelectedBoardId();
      const nextId =
        (preferred && listed.some((item) => item.id === preferred) ? preferred : null) ??
        listed[0]?.id ??
        null;
      setSelectedId(nextId);
      if (nextId) {
        saveSelectedBoardId(nextId);
        setBoard(await getBoard(nextId));
      } else {
        setBoard(null);
      }
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSelectBoard(boardId: number): Promise<void> {
    saveSelectedBoardId(boardId);
    setSelectedId(boardId);
    try {
      setBoard(await getBoard(boardId));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDuplicateBoard(): Promise<void> {
    const user = readUser();
    if (!user) throw new Error("You need to log in.");
    if (!board) throw new Error("No board selected.");
    const created = await duplicateBoard(board.id, user.id);
    saveSelectedBoardId(created.id);
    setSelectedId(created.id);
    setBoards((current) => [...current, { id: created.id, name: created.name, created_at: created.created_at }]);
    setBoard(created);
  }

  async function handleDuplicateTask(taskId: number): Promise<void> {
    await duplicateTask(taskId);
    await load();
  }

  async function handleCreateBoard(name: string): Promise<void> {
    const user = readUser();
    if (!user) throw new Error("You need to log in.");
    const created = await createBoard(name, user.id);
    saveSelectedBoardId(created.id);
    setSelectedId(created.id);
    setBoards((current) => [...current, { id: created.id, name: created.name, created_at: created.created_at }]);
    setBoard(created);
  }

  async function handleCreate(input: CreateTaskRequest): Promise<void> {
    await createTask(input);
    await load();
  }

  async function handleDelete(taskId: number): Promise<void> {
    await deleteTask(taskId);
    await load();
  }

  async function handleCreateColumn(name: string): Promise<void> {
    if (!board) throw new Error("No board selected.");
    await createColumn({ boardId: board.id, name });
    await load();
  }

  async function handleRenameColumn(columnId: number, name: string): Promise<void> {
    await updateColumn(columnId, { name });
    await load();
  }

  async function handleMoveColumn(columnId: number, position: number): Promise<void> {
    setBoard((current) => (current ? moveColumn(current, columnId, position) : current));
    try {
      await updateColumn(columnId, { position });
    } catch (err) {
      setError(errorMessage(err));
      await load();
    }
  }

  async function handleEdit(
    taskId: number,
    fields: {
      title: string;
      description: string;
      dueDate?: string | null;
      startDate?: string | null;
      completedDate?: string | null;
      priority?: TaskPriority;
      labels?: TaskLabel[];
    },
  ): Promise<void> {
    await updateTask(taskId, fields);
    await load();
  }

  function handleDragStart(event: DragStartEvent): void {
    if (!board) return;
    const columnId = parseColumnSortId(String(event.active.id));
    if (columnId !== null) {
      columnDrag.current = {
        id: columnId,
        from: board.columns.findIndex((column) => column.id === columnId),
      };
      return;
    }
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;
    const task = findTask(board, taskId);
    if (!task) return;
    const column = board.columns.find((item) => item.id === task.column_id);
    dragOrigin.current = {
      columnId: task.column_id,
      position: column?.tasks.findIndex((item) => item.id === taskId) ?? task.position,
    };
    setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent): void {
    if (!event.over) return;
    const draggedColumnId = parseColumnSortId(String(event.active.id));
    if (draggedColumnId !== null) {
      const overColumnId = parseColumnSortId(String(event.over.id));
      if (overColumnId === null || overColumnId === draggedColumnId) return;
      setBoard((currentBoard) => {
        if (!currentBoard) return currentBoard;
        const toIndex = currentBoard.columns.findIndex((column) => column.id === overColumnId);
        if (toIndex < 0) return currentBoard;
        const fromIndex = currentBoard.columns.findIndex((column) => column.id === draggedColumnId);
        if (fromIndex === toIndex) return currentBoard;
        return moveColumn(currentBoard, draggedColumnId, toIndex);
      });
      return;
    }
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;
    const overId = String(event.over.id);
    if (overId === String(event.active.id)) return;

    setBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;
      const dest = dropIndex(currentBoard, taskId, overId);
      if (!dest) return currentBoard;
      const current = findTask(currentBoard, taskId);
      if (!current) return currentBoard;
      const sourceColumn = currentBoard.columns.find((column) => column.id === current.column_id);
      const visualIndex = sourceColumn?.tasks.findIndex((task) => task.id === taskId) ?? -1;
      if (dest.columnId === current.column_id && dest.position === visualIndex) {
        return currentBoard;
      }
      return moveTask(currentBoard, taskId, dest.columnId, dest.position);
    });
  }

  async function handleDragEnd(): Promise<void> {
    const columnMove = columnDrag.current;
    columnDrag.current = null;
    if (columnMove) {
      const latest = boardRef.current;
      if (!latest) return;
      const toIndex = latest.columns.findIndex((column) => column.id === columnMove.id);
      if (toIndex < 0 || toIndex === columnMove.from) return;
      try {
        await updateColumn(columnMove.id, { position: toIndex });
      } catch (err) {
        setError(errorMessage(err));
        await load();
      }
      return;
    }

    const dragging = activeTask;
    const origin = dragOrigin.current;
    setActiveTask(null);
    dragOrigin.current = null;
    const latest = boardRef.current;
    if (!latest || !dragging || !origin) return;

    const current = findTask(latest, dragging.id);
    if (!current) return;
    if (current.column_id === origin.columnId && current.position === origin.position) {
      return;
    }

    try {
      await updateTask(dragging.id, {
        columnId: current.column_id,
        position: current.position,
      });
      await load();
    } catch (err) {
      setError(errorMessage(err));
      await load();
    }
  }

  const inProgressCount =
    board?.columns.find((column) => isInProgressColumnName(column.name))?.tasks.length ?? 0;

  function isVisible(task: Task, columnName: string): boolean {
    return (
      taskMatchesDateFilter(task, columnName, dateFrom, dateTo, dateField) &&
      taskMatchesSearch(task, search) &&
      taskMatchesView(task, columnName, view)
    );
  }

  const visibleColumns =
    board?.columns.filter(
      (column) => view === "all" || column.tasks.some((task) => isVisible(task, column.name)),
    ) ?? [];

  function viewCount(nextView: BoardView): number {
    if (!board) return 0;
    return board.columns.reduce(
      (count, column) =>
        count +
        column.tasks.filter(
          (task) =>
            taskMatchesDateFilter(task, column.name, dateFrom, dateTo, dateField) &&
            taskMatchesSearch(task, search) &&
            taskMatchesView(task, column.name, nextView),
        ).length,
      0,
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800 dark:text-teal-300">
          Workspace
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Task Management Board
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">
          Drag cards between columns. Rename a column, drag its handle, or add a new one.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4">
        <BoardSwitcher
          boards={boards}
          selectedId={selectedId}
          onSelect={(boardId) => {
            void handleSelectBoard(boardId);
          }}
          onCreate={handleCreateBoard}
          onDuplicate={handleDuplicateBoard}
        />
      </div>

      {board ? <AddTaskForm columns={board.columns} onCreated={handleCreate} /> : null}

      <div className="mb-6 flex flex-col gap-4">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
            Search
          </span>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, description, or label…"
              className="w-full max-w-md rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Clear
              </button>
            ) : null}
          </div>
        </label>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
            View
          </p>
          <div className="flex flex-wrap gap-2">
            {BOARD_VIEWS.map((option) => {
              const selected = view === option.value;
              const count = viewCount(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selected
                      ? "border-teal-800 bg-teal-800 text-white dark:border-teal-700 dark:bg-teal-700"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-800"
                  }`}
                >
                  {option.label}
                  {option.value !== "all" ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            field={dateField}
            matchCount={
              board?.columns.reduce(
                (count, column) =>
                  count +
                  column.tasks.filter((task) => isVisible(task, column.name)).length,
                0,
              ) ?? 0
            }
            totalCount={board?.columns.reduce((count, column) => count + column.tasks.length, 0) ?? 0}
            filterActive={Boolean(dateFrom || dateTo || search.trim() || view !== "all")}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onFieldChange={setDateField}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
            }}
          />
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as TaskSort)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            >
              <option value="board">Board order</option>
              <option value="priority-desc">Priority: high to low</option>
              <option value="priority-asc">Priority: low to high</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              In progress limit
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={wipLimit}
              onChange={(event) => setWipLimit(saveWipLimit(Number(event.target.value)))}
              className="w-24 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            />
          </label>
        </div>
      </div>

      {inProgressCount > wipLimit ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          In Progress has {inProgressCount} cards (limit {wipLimit}). Finish or move some before starting more.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      {board ? (
        <DndContext
          sensors={sensors}
          collisionDetection={boardCollision}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={() => void handleDragEnd()}
          onDragCancel={() => {
            setActiveTask(null);
            columnDrag.current = null;
          }}
        >
          <SortableContext
            items={visibleColumns.map((column) => columnSortId(column.id))}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              {visibleColumns.map((column) => {
                const index = board.columns.findIndex((item) => item.id === column.id);
                return (
                  <Column
                    key={column.id}
                    column={column}
                    index={index}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicateTask}
                    onEdit={handleEdit}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    dateField={dateField}
                    sort={sort}
                    search={search}
                    view={view}
                    onLabelClick={(label) => setSearch(label)}
                    wipLimit={wipLimit}
                    canMoveLeft={index > 0}
                    canMoveRight={index < board.columns.length - 1}
                    onRename={handleRenameColumn}
                    onMove={handleMoveColumn}
                  />
                );
              })}
              {view === "all" ? <AddColumnCard onCreate={handleCreateColumn} /> : null}
              {visibleColumns.length === 0 ? (
                <p className="py-10 text-sm text-stone-500 dark:text-stone-400">
                  {BOARD_VIEWS.find((option) => option.value === view)?.empty ?? "No matching tasks"}
                </p>
              ) : null}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCardFace task={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : !error ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {boards.length === 0 ? "Create a board to get started." : "Loading board…"}
        </p>
      ) : null}
    </div>
  );
}
