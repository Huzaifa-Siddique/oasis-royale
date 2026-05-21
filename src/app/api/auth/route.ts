import { NextRequest } from "next/server";

const ADMIN_EMAIL = "admin@oasisroyale.com";
const ADMIN_PASSWORD = "admin123";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
    return Response.json({
      token,
      user: { email, name: "Admin", role: "admin" },
    });
  }

  return Response.json({ error: "Invalid credentials" }, { status: 401 });
}
