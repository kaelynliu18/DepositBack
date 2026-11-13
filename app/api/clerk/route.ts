// STUB (Step 1): returns the demo fixture. Step 2 replaces this with the real Clerk.
import { NextResponse } from "next/server";
import fixture from "@/public/demo/clerk.json";

export async function POST() {
  return NextResponse.json(fixture, { headers: { "x-demo-fallback": "1" } });
}
