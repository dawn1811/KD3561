import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { syncFarms } from "../lib/api";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function ProfileSetupPage() {
  const { governorId } = useAuth();
  const router = useRouter();

  const [combatRole, setCombatRole] = useState("field");
  const [aooTeam, setAooTeam] = useState("none");
  const [farms, setFarms] = useState([{ name: "", power: "", cityHall: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFarmChange = (index: number, field: string, value: string) => {
    const updated = [...farms];
    (updated[index] as any)[field] = value;
    setFarms(updated);
  };

  const addFarm = () => {
    setFarms([...farms, { name: "", power: "", cityHall: "" }]);
  };

  const saveProfile = async () => {
    if (!governorId) return;
    setLoading(true);
    setError(null);

    try {
      // Save base profile to Firestore
      await setDoc(
        doc(db, "players_profiles", governorId),
        {
          combatRole,
          aooTeam
        },
        { merge: true }
      );

      // Sync farms to Firestore + Google Sheet via backend
      await syncFarms(governorId, farms.filter(f => f.name.trim() !== ""));

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-xl rounded-lg bg-gray-900 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          Complete Your Profile
        </h1>

        {/* Combat Role */}
        <label className="block mb-2">Combat Role:</label>
        <select
          value={combatRole}
          onChange={(e) => setCombatRole(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        >
          <option value="rally">Rally</option>
          <option value="garrison">Garrison</option>
          <option value="field">Field</option>
        </select>

        {/* AoO Team */}
        <label className="block mb-2">AoO Team:</label>
        <select
          value={aooTeam}
          onChange={(e) => setAooTeam(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        >
          <option value="none">None</option>
          <option value="team1">Team 1</option>
          <option value="team2">Team 2</option>
        </select>

        {/* Farms */}
        <h2 className="text-xl font-semibold text-yellow-400 mt-6 mb-2">
          Register Your Farms
        </h2>
        {farms.map((farm, i) => (
          <div key={i} className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Farm Name"
              value={farm.name}
              onChange={(e) => handleFarmChange(i, "name", e.target.value)}
              className="w-full rounded-md bg-gray-800 p-3 text-white"
            />
            <input
              type="number"
              placeholder="Power"
              value={farm.power}
              onChange={(e) => handleFarmChange(i, "power", e.target.value)}
              className="w-full rounded-md bg-gray-800 p-3 text-white"
            />
            <input
              type="number"
              placeholder="City Hall Level"
              value={farm.cityHall}
              onChange={(e) => handleFarmChange(i, "cityHall", e.target.value)}
              className="w-full rounded-md bg-gray-800 p-3 text-white"
            />
          </div>
        ))}
        <button
          onClick={addFarm}
          className="w-full rounded-md bg-gray-700 p-2 mb-4 hover:bg-gray-600"
        >
          + Add Another Farm
        </button>

        {/* Save Button */}
        <button
          onClick={saveProfile}
          disabled={loading}
          className="w-full rounded-md bg-yellow-500 p-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}
