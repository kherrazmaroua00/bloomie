"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

function dateKey(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0];
}

function isToday(dateStr) {
  return dateKey(dateStr) === dateKey(new Date());
}

function formatDayLabel(dateKeyStr) {
  if (dateKeyStr === dateKey(new Date())) return "Today";
  return new Date(dateKeyStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ToDoList() {
  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("today");
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  async function fetchAllTasks() {
    try {
      const res = await fetch("/api/tasks/all");
      const data = await res.json();
      if (res.ok) {
        setAllTasks(data.tasks);
      } else {
        setError(data.error || "Could not load tasks");
      }
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  const viewingToday = selectedDay === "today";

  const pastDays = useMemo(() => {
    const keys = new Set(
      allTasks.filter((t) => !isToday(t.createdAt)).map((t) => dateKey(t.createdAt))
    );
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [allTasks]);

  const visibleTasks = useMemo(() => {
    const filtered = viewingToday
      ? allTasks.filter((t) => isToday(t.createdAt))
      : allTasks.filter((t) => dateKey(t.createdAt) === selectedDay);
    return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [allTasks, selectedDay, viewingToday]);

  const displayedTasks = showAll ? visibleTasks : visibleTasks.slice(0, 4);

  async function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask }),
      });
      const data = await res.json();
      if (res.ok) {
        setAllTasks([...allTasks, data.task]);
        setNewTask("");
        setError("");
      } else {
        setError(data.error || "Could not add task");
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  async function toggleTask(id) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setAllTasks(allTasks.map((t) => (t.id === id ? data.task : t)));
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading tasks...</p>;

  return (
    <div className="relative bg-panel rounded-2xl p-6 overflow-hidden">
      {/* Faded background art */}
      <Image
        src="/flowertdl.svg"
        alt=""
        fill
        className=" object-right  pointer-events-none select-none"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-green-dark tracking-wide">
            TO DO LIST
          </h3>

          <div className="relative">
            <button
              onClick={() => setDayPickerOpen(!dayPickerOpen)}
              className="text-sm bg-white border border-border rounded-full px-4 py-1.5 text-muted flex items-center gap-1"
            >
              {viewingToday ? "Today" : formatDayLabel(selectedDay)}
              <span className="text-xs">▾</span>
            </button>

            {dayPickerOpen && (
              <div className="absolute top-9 right-0 bg-white border border-border rounded-lg shadow-md z-20 w-40 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedDay("today");
                    setDayPickerOpen(false);
                    setShowAll(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-xs hover:bg-cream ${
                    viewingToday ? "text-green font-medium" : "text-green-dark"
                  }`}
                >
                  Today
                </button>
                {pastDays.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted">No past days yet</p>
                )}
                {pastDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setDayPickerOpen(false);
                      setShowAll(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-cream ${
                      selectedDay === day ? "text-green font-medium" : "text-green-dark"
                    }`}
                  >
                    {formatDayLabel(day)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-coral text-sm mb-3">{error}</p>}

        {/* Task list */}
        <ul className="flex flex-col">
          {displayedTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 py-3 border-b border-border last:border-b-0"
            >
              <button
                onClick={() => viewingToday && toggleTask(task.id)}
                disabled={!viewingToday}
                className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition disabled:cursor-not-allowed ${
                  task.completed
                    ? "bg-green border-green"
                    : "bg-white border-border"
                }`}
              >
                {task.completed && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <span
                  className={`block text-sm ${
                    task.completed ? "line-through text-muted" : "text-green-dark"
                  }`}
                >
                  {task.title}
                </span>
                {task.completed && (
                  <span className="inline-block mt-1 text-xs bg-green/15 text-green px-2 py-0.5 rounded-full">
                    Done
                  </span>
                )}
              </div>
            </li>
          ))}

          {displayedTasks.length === 0 && (
            <p className="text-muted text-sm py-4">
              {viewingToday ? "No tasks yet — add one below." : "No tasks recorded this day."}
            </p>
          )}
        </ul>

        {visibleTasks.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm text-green font-medium mt-3 mb-1"
          >
            {showAll ? "Show less ↑" : "View all tasks →"}
          </button>
        )}

        {!viewingToday && (
          <p className="text-xs text-muted text-center mt-2 italic">
            Read-only — past days can't be edited
          </p>
        )}

        {/* Add task input */}
        {viewingToday && (
          <form
            onSubmit={addTask}
            className="mt-4 flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-3"
          >
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="TO DO LIST"
              className="flex-1 bg-transparent text-sm text-muted outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className=" p-2 rounded-lg transition"
              aria-label="Add task"
            >
              <Image src="/save.svg" alt="Save" width={40} height={40} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}