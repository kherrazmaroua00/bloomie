"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    let data = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: "The server returned an invalid response." };
    }

    if (res.ok) {
      router.push("/login");
    } else {
      setError(data.error || "Signup failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Sign up</button>
    </form>
  );
}