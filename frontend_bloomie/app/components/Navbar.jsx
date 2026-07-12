"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Could not fetch user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="bg-panel rounded-2xl px-6 py-4 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Image
          src="/bloomie-logo.svg"
          alt="Bloomie logo"
          width={36}
          height={36}
        />
        <div>
          <h1 className="text-lg font-bold text-green-dark leading-tight">Bloomie</h1>
          <p className="text-xs text-muted leading-tight">Focus. Plan. Reflect. Grow.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!loading && user && (
          <span className="text-sm text-green-dark font-medium">
            {user.fullName}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-coral hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}