"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const MOODS = [
  { key: "great", label: "Great", icon: "/great.svg", border: "border-green" },
  { key: "good", label: "Good", icon: "/good.svg", border: "border-coral" },
  { key: "okay", label: "Okay", icon: "/okay.svg",  border: "border-blue-gray" },
  { key: "tired", label: "Tired", icon: "/tired.svg", border: "border-amber" },
  { key: "stressed", label: "Stressed", icon: "/stressed.svg", border: "border-rose" },
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodayMood();
  }, []);

  async function fetchTodayMood() {
    try {
      const res = await fetch("/api/moods/today");
      const data = await res.json();
      if (res.ok) {
        setSelectedMood(data.mood);
      } else {
        setError(data.error || "Could not load mood");
      }
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  async function selectMood(moodKey) {
    setSelectedMood(moodKey);
    try {
      await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: moodKey }),
      });
    } catch (err) {
      setError("Could not save mood");
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading mood...</p>;

  return (
    <div className="bg-panel rounded-2xl p-6">
      <h3 className="text-lg font-bold text-green-dark tracking-wide text-center mb-6">
        HOW ARE YOU FEELING?
      </h3>

      {error && <p className="text-coral text-sm text-center mb-3">{error}</p>}

      <div className="flex justify-center gap-4 flex-wrap">
        {MOODS.map((m) => {
          const isActive = selectedMood === m.key;
          return (
            <button
              key={m.key}
              onClick={() => selectMood(m.key)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition ${
                  m.bg
                } ${isActive ? m.border : "border-transparent"}`}
              >
                <Image src={m.icon} alt={m.label} width={50} height={50} />
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={`text-sm ${
                    isActive ? "text-green-dark font-semibold" : "text-muted"
                  }`}
                >
                  {m.label}
                </span>
                {isActive && (
                  <span className="mt-1 w-6 h-0.5 bg-green-dark rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}