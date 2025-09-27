import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

interface Announcement {
  id: string;
  title: string;
  message: string;
  tag?: string;
  expiresAt?: any;
  pinned?: boolean;
}

export default function ManageAnnouncements() {
  const { governorId, role } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("General");
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Announcement[] = [];
      snapshot.forEach((doc) =>
        items.push({ id: doc.id, ...(doc.data() as Omit<Announcement, "id">) })
      );
      setAnnouncements(items);
    });
    return () => unsub();
  }, []);

  if (role !== "officer" && role !== "king") {
    return <p className="p-6">You don’t have permission to manage announcements.</p>;
  }

  const addAnnouncement = async () => {
    if (!title.trim() || !message.trim()) return;
    await addDoc(collection(db, "announcements"), {
      title,
      message,
      tag,
      pinned,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: serverTimestamp(),
      createdBy: governorId,
    });
    setTitle("");
    setMessage("");
    setTag("General");
    setExpiresAt("");
    setPinned(false);
  };

  const deleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Manage Announcements</h1>

      {/* Add form */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />

        {/* Tag */}
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        >
          <option value="General">General</option>
          <option value="KVK">KVK</option>
          <option value="AoO">AoO</option>
          <option value="Kingdom">Kingdom</option>
        </select>

        {/* Expiry */}
        <label className="block mb-2">Expires At:</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />

        {/* Pinned */}
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="mr-2"
          />
          Pin Announcement
        </label>

        <button
          onClick={addAnnouncement}
          className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400"
        >
          Add Announcement
        </button>
      </div>

      {/* Existing announcements */}
      <ul className="space-y-4">
        {announcements.map((a) => (
          <li key={a.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-yellow-400 font-bold">{a.title}</h3>
              {a.tag && (
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    a.tag === "KVK"
                      ? "bg-red-500"
                      : a.tag === "AoO"
                      ? "bg-blue-500"
                      : a.tag === "Kingdom"
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-600"
                  }`}
                >
                  {a.tag}
                </span>
              )}
            </div>
            <p>{a.message}</p>
            {a.expiresAt && (
              <p className="text-xs text-gray-400">
                Expires: {new Date(a.expiresAt.seconds * 1000).toLocaleString()}
              </p>
            )}
            {a.pinned && <p className="text-xs text-green-400">📌 Pinned</p>}
            <button
              onClick={() => deleteAnnouncement(a.id)}
              className="mt-2 text-sm text-red-400 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
