import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    // Forward to Firebase Functions backend
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/subscribe_announcements`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
