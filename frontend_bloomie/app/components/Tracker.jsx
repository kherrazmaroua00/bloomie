"use client";
import { useState, useEffect } from "react";

const DAILY_GOAL_MINUTES = 240; // 4h goal, matches your mockup — adjust anytime

export default function Tracker() {
  const [stats, setStats] = useState({ sessionsCount: 0, totalMinutes: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [focusRes, tasksRes] = await Promise.all([
        fetch("/api/focus-sessions/today"),
        fetch("/api/tasks"),
      ]);

      const focusData = await focusRes.json();
      const tasksData = await tasksRes.json();

      if (focusRes.ok) setStats(focusData);
      if (tasksRes.ok) setTasks(tasksData.tasks);
    } catch (err) {
      setError("Could not load tracking data");
    } finally {
      setLoading(false);
    }
  }

  function formatHoursMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? `${m}m` : ""}`;
  }

  const goalPercent = Math.min(
    100,
    Math.round((stats.totalMinutes / DAILY_GOAL_MINUTES) * 100)
  );

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) return <p className="text-muted text-sm">Loading tracker...</p>;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-coral text-sm">{error}</p>}

      {/* Focus Sessions */}
      <div className="bg-panel rounded-2xl p-5">
        <p className="text-xs text-muted mb-2">FOCUS SESSIONS</p>
        <p className="text-3xl font-bold text-green-dark">{stats.sessionsCount}</p>
        <p className="text-xs text-muted">sessions</p>
      </div>

      {/* Focus Time with circular progress */}
      <div className="bg-panel rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-2">FOCUS TIME</p>
          <p className="text-2xl font-bold text-green-dark">
            {formatHoursMinutes(stats.totalMinutes)}
          </p>
          <p className="text-xs text-muted">of 4h goal</p>
        </div>
        <div className="relative w-14 h-14">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-border)" strokeWidth="6" />
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              stroke="var(--color-green)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - goalPercent / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-green-dark">
            {goalPercent}%
          </span>
        </div>
      </div>

      {/* Tasks Completed */}
      <div className="bg-panel rounded-2xl p-5">
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-xs text-muted">TASKS COMPLETED</p>
          <p className="text-xs text-muted">{taskPercent}%</p>
        </div>
        <p className="text-lg font-bold text-green-dark mb-2">
          {completedTasks} <span className="text-sm text-muted">/ {totalTasks}</span>
        </p>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-all"
            style={{ width: `${taskPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}