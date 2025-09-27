"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from "../lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [governorId, setGovernorId] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ governorId, password, inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        // Sign in immediately with returned token
        await signInWithCustomToken(auth, data.token);
        router.push("/profile-setup");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err: any) {
      console.error(err);
      setError("Registration error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <form
        onSubmit={handleRegister}
        className="bg-gray-900 p-6 rounded shadow-md w-96 text-center"
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="Kingdom Logo"
          className="mx-auto mb-6 w-24 h-24"
        />

        <h1 className="text-2xl font-bold text-yellow-400 mb-4">
          Register Governor
        </h1>

        <label className="block mb-2 text-left">
          Governor ID
          <input
            type="text"
            value={governorId}
            onChange={(e) => setGovernorId(e.target.value)}
            className="w-full p-2 mt-1 bg-gray-800 rounded"
            required
          />
        </label>

        <label className="block mb-4 text-left">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mt-1 bg-gray-800 rounded"
            required
          />
        </label>

        <label className="block mb-4 text-left">
          Invite Code (optional)
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full p-2 mt-1 bg-gray-800 rounded"
            placeholder="Only for officers/kings"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-400"
        >
          Register
        </button>

        {error && <p className="text-red-500 mt-3">{error}</p>}
      </form>
    </div>
  );
}
