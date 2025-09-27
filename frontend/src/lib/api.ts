// API helpers to call backend Firebase Functions
// Base URL comes from NEXT_PUBLIC_API_BASE_URL in .env.local

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface LoginResponse {
  token: string;
}

export async function login(governorId: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ governorId, password }),
  });
  if (!res.ok) throw new Error("Invalid login");
  return res.json();
}

export async function createUser(governorId: string, password: string) {
  const res = await fetch(`${API_BASE}/create_user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ governorId, password }),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function processKVK() {
  const res = await fetch(`${API_BASE}/process_kvk_spreadsheets`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to process KVK spreadsheets");
  return res.text();
}
export async function syncFarms(governorId: string, farms: any[]) {
  const res = await fetch(`${API_BASE}/sync_farms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ governorId, farms }),
  });
  if (!res.ok) throw new Error("Failed to sync farms");
  return res.json();
}
