import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

interface PlayerStats {
  governorId: string;
  power: number;
  totalKP: number;
  killsT4: number;
  killsT5: number;
  deads: number;
  dkp: number;
}

export default function KvkPage() {
  const { user, role } = useAuth();
  const governorId = user?.uid || null;

  const [kvks, setKvks] = useState<string[]>(["Kvk1", "Kvk2", "Kvk3"]);
  const [selectedKvk, setSelectedKvk] = useState("Kvk1");

  // Player snapshot states
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);

  // Player fallback stats
  const [myStats, setMyStats] = useState<PlayerStats | null>(null);

  // Admin view
  const [kingdomStats, setKingdomStats] = useState<PlayerStats[]>([]);

  // Load my base stats (for fallback)
  useEffect(() => {
    if (!governorId || !selectedKvk) return;
    const loadStats = async () => {
      const docRef = doc(db, "kvk_stats", selectedKvk, "players", governorId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setMyStats(snap.data() as PlayerStats);
      } else {
        setMyStats(null);
      }
    };
    loadStats();
  }, [governorId, selectedKvk]);

  // Load available snapshot dates (based on my own data for now)
  useEffect(() => {
    if (!governorId || !selectedKvk) return;
    const loadDates = async () => {
      const colRef = collection(
        db,
        "kvk_stats",
        selectedKvk,
        "players",
        governorId,
        "snapshots"
      );
      const snap = await getDocs(colRef);
      const items: string[] = [];
      snap.forEach((d) => items.push(d.id));
      setDates(items);
      if (items.length > 0 && !selectedDate) {
        setSelectedDate(items[0]);
      }
    };
    loadDates();
  }, [governorId, selectedKvk]);

  // Load my snapshot
  useEffect(() => {
    if (!governorId || !selectedKvk || !selectedDate) return;
    const loadSnapshot = async () => {
      const docRef = doc(
        db,
        "kvk_stats",
        selectedKvk,
        "players",
        governorId,
        "snapshots",
        selectedDate
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSnapshot(snap.data());
      } else {
        setSnapshot(null);
      }
    };
    loadSnapshot();
  }, [governorId, selectedKvk, selectedDate]);

  // Load admin kingdom stats (either baseline or snapshot date)
  useEffect(() => {
    if (role !== "officer" && role !== "king") return;

    const loadKingdom = async () => {
      const playersCol = collection(db, "kvk_stats", selectedKvk, "players");
      const playersSnap = await getDocs(playersCol);

      const items: PlayerStats[] = [];

      for (const player of playersSnap.docs) {
        const govId = player.id;

        if (selectedDate) {
          // Try to load snapshot
          const snapRef = doc(
            db,
            "kvk_stats",
            selectedKvk,
            "players",
            govId,
            "snapshots",
            selectedDate
          );
          const snapDoc = await getDoc(snapRef);
          if (snapDoc.exists()) {
            const data = snapDoc.data() as PlayerStats;
            items.push({ ...data, governorId: govId });
          }
        } else {
          // Fallback: use main doc
          const data = player.data() as PlayerStats;
          items.push({ ...data, governorId: govId });
        }
      }

      setKingdomStats(items);
    };

    loadKingdom();
  }, [role, selectedKvk, selectedDate]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">KVK Stats & DKP</h1>

      {/* KVK Selector */}
      <select
        value={selectedKvk}
        onChange={(e) => {
          setSelectedKvk(e.target.value);
          setSelectedDate(null);
          setSnapshot(null);
        }}
        className="mb-6 p-2 rounded bg-gray-800 text-white"
      >
        {kvks.map((kvk) => (
          <option key={kvk} value={kvk}>
            {kvk}
          </option>
        ))}
      </select>

      {/* Snapshot Date Selector */}
      {dates.length > 0 && (
        <select
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mb-6 ml-4 p-2 rounded bg-gray-800 text-white"
        >
          <option value="">Current Totals</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}

      {/* My Snapshot Stats */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h2 className="text-xl text-yellow-400 mb-4">My Stats</h2>
        {snapshot ? (
          <ul className="space-y-2">
            <li>
              Power: {snapshot.power.toLocaleString()} (
              {snapshot.deltaPower >= 0 ? "+" : ""}
              {snapshot.deltaPower})
            </li>
            <li>
              Total KP: {snapshot.totalKP.toLocaleString()} (+{snapshot.deltaKP})
            </li>
            <li>
              T4 Kills: {snapshot.killsT4.toLocaleString()} (+{snapshot.deltaT4})
            </li>
            <li>
              T5 Kills: {snapshot.killsT5.toLocaleString()} (+{snapshot.deltaT5})
            </li>
            <li>
              Dead Troops: {snapshot.deads.toLocaleString()} (+{snapshot.deltaDeads})
            </li>
            <li className="text-yellow-300 font-bold">
              DKP: {snapshot.dkp.toLocaleString()}
            </li>
          </ul>
        ) : myStats ? (
          <ul>
            <li>Power: {myStats.power.toLocaleString()}</li>
            <li>Total KP: {myStats.totalKP.toLocaleString()}</li>
            <li>T4 Kills: {myStats.killsT4.toLocaleString()}</li>
            <li>T5 Kills: {myStats.killsT5.toLocaleString()}</li>
            <li>Dead Troops: {myStats.deads.toLocaleString()}</li>
            <li className="text-yellow-300 font-bold">
              DKP: {myStats.dkp.toLocaleString()}
            </li>
          </ul>
        ) : (
          <p>No stats found for this KVK.</p>
        )}
      </div>

      {/* Admin Kingdom Stats */}
      {(role === "officer" || role === "king") && (
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl text-yellow-400 mb-4">Kingdom Stats</h2>
          <table className="w-full text-sm border border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-yellow-400">
                <th className="p-2 text-left">Governor</th>
                <th className="p-2 text-right">Power</th>
                <th className="p-2 text-right">Total KP</th>
                <th className="p-2 text-right">DKP</th>
              </tr>
            </thead>
            <tbody>
              {kingdomStats.map((p, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="p-2">{p.governorId}</td>
                  <td className="p-2 text-right">{p.power?.toLocaleString()}</td>
                  <td className="p-2 text-right">{p.totalKP?.toLocaleString()}</td>
                  <td className="p-2 text-right">{p.dkp?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
