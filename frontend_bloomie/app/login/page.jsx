"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const [mode, setMode] = useState("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const body = isSignup ? { fullName, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (isSignup) {
        setMode("login");
        setPassword("");
        setError("");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="flex gap-6 w-full max-w-4xl">
        {/* Left panel - branding */}
        <div className="hidden md:flex flex-col items-center justify-center bg-panel rounded-[2rem] flex-1 p-10">
          <Image
            src="/bloomie-logo.svg"
            alt="Bloomie logo"
            width={100}
            height={100}
            className="mb-4"
          />
          <h1 className="text-4xl font-bold text-green-dark tracking-wide">Bloomie</h1>
          <p className="text-muted mt-2 text-sm">Focus. Plan. Reflect. Grow.</p>
        </div>

        {/* Right panel - form */}
        <div className="bg-panel rounded-[2rem] flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-base font-semibold text-green-dark mb-6 tracking-wide">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignup && (
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-green rounded-lg px-4 py-3 bg-white text-sm outline-none focus:ring-2 focus:ring-green/30"
                required
              />
            )}
            <input
              type="email"
              placeholder="get@ziontutorial.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-green rounded-lg px-4 py-3 bg-white text-sm outline-none focus:ring-2 focus:ring-green/30"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-green rounded-lg px-4 py-3 bg-white text-sm outline-none focus:ring-2 focus:ring-green/30"
              required
            />

            {error && <p className="text-coral text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-green hover:bg-green-hover text-white rounded-lg py-3 text-sm font-medium transition disabled:opacity-60"
            >
              {loading ? "Please wait..." : isSignup ? "Sign up" : "Sign In"}
            </button>

            <p className="text-center text-sm text-muted">
              {isSignup ? "Have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignup ? "login" : "signup");
                  setError("");
                }}
                className="text-rose underline"
              >
                {isSignup ? "Sign In" : "Sign up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}