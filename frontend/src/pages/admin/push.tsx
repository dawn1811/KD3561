import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function PushNotificationsPage() {
  const { role } = useAuth();

  const [targets, setTargets] = useState<string[]>(["all"]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  if (role !== "officer" && role !== "king") {
    return <p className="p-6">You don’t have permission to send push notifications.</p>;
  }

  const toggleTarget = (target: string) => {
    setTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  };

  const sendPush = async () => {
    setStatus("Sending...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/send_push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets, title, message }),
      });
      const data = await res.json();
      setStatus(`✅ Sent: ${data.success}, Failed: ${data.failure}`);
    } catch (err) {
      setStatus("❌ Failed to send");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Send Push Notification</h1>

      {/* Title */}
      <input
        type="text"
        placeholder="Notification Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
      />

      {/* Message */}
      <textarea
        placeholder="Notification Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
      />

      {/* Targets */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Targets:</h2>
        {["all", "team1", "team2", "role:officer", "role:king"].map((t) => (
          <label key={t} className="block">
            <input
              type="checkbox"
              checked={targets.includes(t)}
              onChange={() => toggleTarget(t)}
              className="mr-2"
            />
            {t}
          </label>
        ))}
      </div>

      <button
        onClick={sendPush}
        className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400"
      >
        Send Push
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
