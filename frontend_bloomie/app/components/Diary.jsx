"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

const MOOD_STYLES = {
  great: { icon: "/great.svg" },
  good: { icon: "/good.svg" },
  okay: { icon: "/okay.svg" },
  tired: { icon: "/tired.svg"},
  stressed: { icon: "/stressed.svg" },
};

function dateKey(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0];
}

function isToday(dateStr) {
  return dateKey(dateStr) === dateKey(new Date());
}

function formatDayLabel(dateKeyStr) {
  if (dateKeyStr === dateKey(new Date())) return "Today";
  return new Date(dateKeyStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatEntryDate(dateStr) {
  return new Date(dateStr)
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase()
    .replace(",", " •");
}

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [selectedDay, setSelectedDay] = useState("today");
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch("/api/diary");
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries);
      } else {
        setError(data.error || "Could not load diary");
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
      entries.filter((e) => !isToday(e.createdAt)).map((e) => dateKey(e.createdAt))
    );
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const filtered = viewingToday
      ? entries.filter((e) => isToday(e.createdAt))
      : entries.filter((e) => dateKey(e.createdAt) === selectedDay);
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [entries, selectedDay, viewingToday]);

  async function saveEntry() {
    if (!newEntry.trim()) return;
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newEntry }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntries([data.entry, ...entries]);
        setNewEntry("");
        setError("");
      } else {
        setError(data.error || "Could not save entry");
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditContent(entry.content);
  }

  async function saveEdit(id) {
    try {
      const res = await fetch(`/api/diary/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(entries.map((e) => (e.id === id ? data.entry : e)));
        setEditingId(null);
      } else {
        setError(data.error || "Could not update entry");
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  async function deleteEntry(id) {
    try {
      const res = await fetch(`/api/diary/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      } else {
        setError(data.error || "Could not delete entry");
      }
    } catch (err) {
      setError("Could not reach the server");
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading diary...</p>;

  return (
    <div className="relative bg-panel rounded-2xl p-6 overflow-hidden flex flex-col h-full">
      {/* Faded background art */}
      <Image
        src="/flowerd.svg"
        alt=""
        fill
        className=" object-bottom pointer-events-none select-none"
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-green-dark tracking-wide">
            MY DIARY
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

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 mb-4">
          {visibleEntries.map((entry) => {
            const editable = isToday(entry.createdAt);
            const isEditing = editingId === entry.id;
            const moodStyle = entry.mood ? MOOD_STYLES[entry.mood] : null;

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl p-4 border border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-muted tracking-wide">
                    {formatEntryDate(entry.createdAt)}
                  </p>
                  {moodStyle && (
                    <div
                      className={`w-10 h-10  flex items-center justify-center ${moodStyle.border}`}
                    >
                      <Image src={moodStyle.icon} alt={entry.mood} width={40} height={40} />
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="border border-border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green/30 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted text-xs px-3 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className=" hover:bg-amber/30  rounded-lg transition"
                        aria-label="Save"
                      >
                        <Image src="/save.svg" alt="Save" width={35} height={35} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-dark leading-relaxed mb-3">
                    {entry.content}
                  </p>
                )}

                {editable && !isEditing && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className=" hover:bg-coral/25  rounded-lg transition"
                      aria-label="Delete"
                    >
                      <Image src="/delete.svg" alt="Delete" width={40} height={40} />
                    </button>
                    <button
                      onClick={() => startEdit(entry)}
                      className= "hover:bg-green/25 rounded-lg transition"
                      aria-label="Edit"
                    >
                      <Image src="/edit.svg" alt="Edit" width={40} height={40} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {visibleEntries.length === 0 && (
            <p className="text-muted text-sm text-center py-6">
              {viewingToday ? "No entries yet — write your first below." : "No entries this day."}
            </p>
          )}
        </div>

        {!viewingToday && (
          <p className="text-xs text-muted text-center mb-3 italic">
            Read-only — past entries can't be edited
          </p>
        )}

        {/* New entry input — only visible when viewing today */}
        {viewingToday && (
          <div className="bg-white border border-border rounded-xl p-3 flex items-end gap-2">
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="write here your diary...."
              rows={2}
              className="flex-1 bg-transparent text-sm text-green-dark outline-none placeholder:text-muted resize-none"
            />
            <button
              onClick={saveEntry}
              className="hover:bg-amber/30 rounded-lg transition shrink-0"
              aria-label="Save entry"
            >
              <Image src="/save.svg" alt="Save" width={40} height={40} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}