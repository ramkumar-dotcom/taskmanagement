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
import type { BoardPageData, CreateTaskRequest, Task } from "@tmb/shared";
import { createBoard, createTask, deleteTask, getBoard, listBoards, updateTask } from "@/lib/api";
import { readSelectedBoardId, readUser, saveSelectedBoardId } from "@/lib/auth";
import { taskMatchesDateFilter, type DateFilterField } from "@/lib/dates";
import { boardCollision, dropIndex, findTask, moveTask, parseTaskDragId } from "@/lib/dnd";
import { errorMessage } from "@/lib/parse";
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const boardRef = useRef(board);
  const dragOrigin = useRef<{ columnId: number; position: number } | null>(null);
  boardRef.current = board;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  useEffect(() => {
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

  async function handleEdit(
    taskId: number,
    fields: {
      title: string;
      description: string;
      dueDate?: string | null;
      startDate?: string | null;
      completedDate?: string | null;
    },
  ): Promise<void> {
    await updateTask(taskId, fields);
    await load();
  }

  function handleDragStart(event: DragStartEvent): void {
    if (!board) return;
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
          Drag any card to another column or to a new spot in the list.
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
        />
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          field={dateField}
          matchCount={
            board?.columns.reduce(
              (count, column) =>
                count +
                column.tasks.filter((task) =>
                  taskMatchesDateFilter(task, column.name, dateFrom, dateTo, dateField),
                ).length,
              0,
            ) ?? 0
          }
          totalCount={board?.columns.reduce((count, column) => count + column.tasks.length, 0) ?? 0}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onFieldChange={setDateField}
          onClear={() => {
            setDateFrom("");
            setDateTo("");
          }}
        />
      </div>

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
          onDragCancel={() => setActiveTask(null)}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {board.columns.map((column, index) => (
              <Column
                key={column.id}
                column={column}
                index={index}
                onCreate={handleCreate}
                onDelete={handleDelete}
                onEdit={handleEdit}
                dateFrom={dateFrom}
                dateTo={dateTo}
                dateField={dateField}
              />
            ))}
          </div>
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
