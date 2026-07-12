"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const SESSIONS = [
  { focus: 25, break: 5 },
  { focus: 50, break: 10 },
  { focus: 70, break: 15 },
  { focus: 80, break: 20 },
];

const SOUNDS = [
  { key: "none", label: "No sound", type: "none" },
  { key: "rain", label: "Rain", type: "rain" },
  { key: "ocean", label: "Ocean", type: "ocean" },
  { key: "stream", label: "Stream", type: "stream" },
  { key: "night", label: "Night", type: "night" },
];

const FALLBACK_QUOTES = [
  "Progress, not perfection. You're doing better than you think.",
  "Small steps every day lead to big changes.",
  "You don't have to be perfect, just consistent.",
  "Rest is productive too — breathe.",
  "One task at a time. That's all today needs.",
];

function getFallbackQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((new Date() - start) / 86400000);
  return { quote: FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length], author: null };
}

const STORAGE_KEY = "bloomie-focus-timer";

export default function FocusTimer() {
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);
  const [phase, setPhase] = useState("focus");
  const [totalSeconds, setTotalSeconds] = useState(SESSIONS[0].focus * 60);
  const [secondsLeft, setSecondsLeft] = useState(SESSIONS[0].focus * 60);
  const [status, setStatus] = useState("idle"); // "idle" | "running" | "paused"
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [hydrated, setHydrated] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(null);

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const audioElRef = useRef(null);
  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const lfoRef = useRef(null);
  const cricketTimeoutRef = useRef(null);

  // Restore timer state from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const session = SESSIONS.find((s) => s.focus === data.sessionFocus) || SESSIONS[0];
        setSelectedSession(session);
        setPhase(data.phase);
        setTotalSeconds(data.totalSeconds);

        if (data.status === "running") {
          const remainingMs = data.endTime - Date.now();
          if (remainingMs > 0) {
            endTimeRef.current = data.endTime;
            setSecondsLeft(Math.round(remainingMs / 1000));
            setStatus("paused"); // require a manual Resume click so audio can unlock properly
          } else {
            setSecondsLeft(0);
            setStatus("idle");
            localStorage.removeItem(STORAGE_KEY);
          }
        } else if (data.status === "paused") {
          setSecondsLeft(data.secondsLeft);
          setStatus("paused");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  // Fetch the daily motivational quote (cached per calendar day)
  useEffect(() => {
    fetchDailyQuote();
  }, []);

  async function fetchDailyQuote() {
    const cacheKey = "bloomie-daily-quote";
    const today = new Date().toISOString().split("T")[0];

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          setDailyQuote(parsed);
          return;
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/quote/today");
      const data = await res.json();
      if (res.ok && data.quote) {
        const toStore = { quote: data.quote, author: data.author, date: today };
        localStorage.setItem(cacheKey, JSON.stringify(toStore));
        setDailyQuote(toStore);
      } else {
        setDailyQuote({ ...getFallbackQuote(), date: today });
      }
    } catch (err) {
      console.error("Could not fetch daily quote:", err);
      setDailyQuote({ ...getFallbackQuote(), date: today });
    }
  }

  // Persist timer state
  useEffect(() => {
    if (!hydrated) return;
    if (status === "idle") {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        status,
        endTime: endTimeRef.current,
        secondsLeft,
        phase,
        totalSeconds,
        sessionFocus: selectedSession.focus,
      })
    );
  }, [status, phase, totalSeconds, selectedSession, secondsLeft, hydrated]);

  // Tick loop
  useEffect(() => {
    if (status !== "running") return;

    intervalRef.current = setInterval(() => {
      const remainingMs = endTimeRef.current - Date.now();
      const remaining = Math.max(0, Math.round(remainingMs / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        stopSound();
        playAlarm();
        completeSession();
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [status]);

  // Play/stop ambient sound based on timer state + selection
  useEffect(() => {
    if (status === "running" && phase === "focus") {
      playSound(selectedSound);
    } else {
      stopSound();
    }
    return () => stopSound();
  }, [status, selectedSound, phase]);

  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function makeNoiseBuffer(ctx, seconds = 2) {
    const bufferSize = seconds * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // random amplitude per sample = white noise
    }
    return buffer;
  }

  function playSound(sound) {
    stopSound();

    if (sound.type === "file") {
      if (!audioElRef.current) return;
      audioElRef.current.src = sound.url;
      audioElRef.current.loop = true;
      audioElRef.current.volume = 0.4;
      audioElRef.current.play().catch((err) => console.log("Audio blocked:", err));
      return;
    }

    const ctx = ensureAudioContext();

    if (sound.type === "rain") {
      const source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      noiseSourceRef.current = source;
    }

    if (sound.type === "ocean") {
      const source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;

      const gain = ctx.createGain();
      gain.gain.value = 0.2;

      // LFO makes the volume rise and fall slowly, like waves rolling in
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15; // one full swell every ~6.5 seconds
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      noiseSourceRef.current = source;
      lfoRef.current = lfo;
    }

    if (sound.type === "stream") {
      const source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; // brighter, more "watery" than rain's lowpass
      filter.frequency.value = 1200;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.value = 0.18;

      // Gentle modulation on the filter frequency gives a babbling, uneven texture
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      noiseSourceRef.current = source;
      lfoRef.current = lfo;
    }

    if (sound.type === "night") {
      // Quiet ambient hush bed
      const source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      const gain = ctx.createGain();
      gain.gain.value = 0.06; // very quiet background bed, crickets are the star

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      noiseSourceRef.current = source;

      scheduleCricketChirp(ctx);
    }
  }

  // Plays a short high-pitched chirp at a random interval, then schedules the next one
  function scheduleCricketChirp(ctx) {
    const delay = 400 + Math.random() * 1200; // between 0.4s and 1.6s apart

    cricketTimeoutRef.current = setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 4000 + Math.random() * 500;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);

      scheduleCricketChirp(ctx); // schedule the next chirp, looping continuously
    }, delay);
  }

  function stopSound() {
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch {}
      noiseSourceRef.current = null;
    }
    if (lfoRef.current) {
      try {
        lfoRef.current.stop();
      } catch {}
      lfoRef.current = null;
    }
    if (cricketTimeoutRef.current) {
      clearTimeout(cricketTimeoutRef.current);
      cricketTimeoutRef.current = null;
    }
  }

  function startTimer() {
    ensureAudioContext();
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setStatus("running");
  }

  function pauseTimer() {
    setStatus("paused");
    clearInterval(intervalRef.current);
  }

  function resumeTimer() {
    ensureAudioContext();
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setStatus("running");
  }

  function cancelTimer() {
    clearInterval(intervalRef.current);
    stopSound();
    setStatus("idle");
    setSecondsLeft(totalSeconds);
  }

  function resetTimer(session = selectedSession, targetPhase = "focus") {
    clearInterval(intervalRef.current);
    const mins = targetPhase === "focus" ? session.focus : session.break;
    setPhase(targetPhase);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
    setStatus("idle");
  }

  async function logFocusSession(minutes) {
    try {
      await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: minutes }),
      });
    } catch (err) {
      console.error("Could not log focus session:", err);
    }
  }

  function completeSession() {
    if (phase === "focus") logFocusSession(selectedSession.focus);
    const nextPhase = phase === "focus" ? "break" : "focus";
    resetTimer(selectedSession, nextPhase);
  }

  function selectSession(session) {
    setSelectedSession(session);
    resetTimer(session, "focus");
  }

  function playAlarm() {
    const ctx = ensureAudioContext();
    const beep = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    };
    beep();
    setTimeout(beep, 1400);
    setTimeout(beep, 2800);
  }

  function formatTime(s) {
    const mins = Math.floor(s / 60).toString().padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  if (!hydrated) {
    return (
      <div className="bg-panel rounded-2xl p-6 flex items-center justify-center h-64">
        <p className="text-muted text-sm">Loading timer...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Timer card */}
      <div className="relative bg-panel rounded-2xl p-6 flex flex-col items-center overflow-hidden">
        <Image
          src="/flowert.svg"
          alt=""
          fill
          className="  pointer-events-none select-none"
        />

        <div className="relative z-10 flex flex-col items-center w-full">
          <h3 className="text-lg font-bold text-green-dark tracking-wide mb-6">
            FOCUS TIMER
          </h3>

          <audio ref={audioElRef} />

          {/* Timer circle */}
          <div className="relative w-56 h-56 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-green)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-green-dark tracking-wider">
                {formatTime(secondsLeft)}
              </span>
              <span className="mt-2 text-xs border border-green rounded-full px-3 py-1 text-green-dark">
                {phase === "focus" ? "🌱 Focus Session" : "☕ Break"}
              </span>
            </div>
          </div>

          {/* Controls — state machine */}
          {status === "idle" && (
            <button
              onClick={startTimer}
              className="bg-green hover:bg-green-hover text-white px-10 py-3 rounded-full font-medium mb-6 transition"
            >
              START
            </button>
          )}

          {status === "running" && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={cancelTimer}
                className="bg-gray-300 hover:bg-gray-400 text-white px-8 py-3 rounded-full font-medium transition"
              >
                CANCEL
              </button>
              <button
                onClick={pauseTimer}
                className="bg-coral hover:opacity-90 text-white px-8 py-3 rounded-full font-medium transition"
              >
                PAUSE
              </button>
            </div>
          )}

          {status === "paused" && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={cancelTimer}
                className="bg-gray-300 hover:bg-gray-400 text-white px-8 py-3 rounded-full font-medium transition"
              >
                CANCEL
              </button>
              <button
                onClick={resumeTimer}
                className="bg-green hover:bg-green-hover text-white px-8 py-3 rounded-full font-medium transition"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Session picker */}
          <h4 className="text-green-dark font-semibold tracking-wide mb-3">
            CHOOSE A SESSION
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
            {SESSIONS.map((s) => {
              const isActive = s.focus === selectedSession.focus;
              return (
                <button
                  key={s.focus}
                  onClick={() => status === "idle" && selectSession(s)}
                  disabled={status !== "idle"}
                  className={`border rounded-xl py-3 text-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive ? "border-green bg-green/30 " : "border-border"
                  }`}
                >
                  <div className={`text-lg font-bold ${isActive ? "text-coral" : "text-green-dark"}`}>
                    {s.focus} / {s.break}
                  </div>
                  <div className="text-xs text-muted">min</div>
                  <div className="text-xs text-green-dark">Focus</div>
                </button>
              );
            })}
          </div>

          {/* Sound picker */}
          <h4 className="text-green-dark font-semibold tracking-wide mb-3">
            WITH SOUNDS
          </h4>
          <div className="flex gap-2 w-full">
            <select
              value={selectedSound.key}
              onChange={(e) => setSelectedSound(SOUNDS.find((s) => s.key === e.target.value))}
              className="flex-1 border border-green rounded-lg px-3 py-2 text-sm text-green-dark outline-none bg-white"
            >
              {SOUNDS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedSound(selectedSound.key === "none" ? SOUNDS[1] : SOUNDS[0])}
              className="border border-green rounded-lg px-3 py-2 text-green-dark"
              aria-label="Toggle sound"
            >
              {selectedSound.key === "none" ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </div>

      {/* Motivation card */}
      <div className="relative bg-panel rounded-2xl p-6 overflow-hidden">
        <Image
          src="/flowerm.svg"
          alt=""
          fill
          className=" object-bottom pointer-events-none select-none"
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <Image src="/heart.svg" alt="" width={20} height={20} className="mb-3" />
          <div className="bg-rose/30 border border-rose/20 rounded-2xl px-5 py-4">
            {dailyQuote ? (
              <>
                <p className="text-sm text-green-dark italic">"{dailyQuote.quote}"</p>
                {dailyQuote.author && (
                  <p className="text-xs text-muted mt-2">— {dailyQuote.author}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted italic">Loading today's quote...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}