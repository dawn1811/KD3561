import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface Announcement {
  id: string;
  title: string;
  message: string;
  tag?: string;
  createdAt?: any;
  expiresAt?: any;
  pinned?: boolean;
}

export default function Announcements() {
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

  const now = new Date();

  const validAnnouncements = announcements
    .filter((a) => !a.expiresAt || new Date(a.expiresAt.seconds * 1000) > now)
    .sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1));

  return (
    <div>
      {validAnnouncements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {validAnnouncements.map((a) => (
            <li key={a.id} className="rounded-lg bg-gray-800 p-4 shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-yellow-400">{a.title}</h3>
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
                <p className="text-xs text-gray-400 mt-2">
                  Expires: {new Date(a.expiresAt.seconds * 1000).toLocaleString()}
                </p>
              )}
              {a.pinned && <p className="text-xs text-green-400">📌 Pinned</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
