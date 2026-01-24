import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    console.log("Throwing test error for Sentry...");
    throw new Error("Sentry API Test Error: Your Backend is 100% Connected!");
    return NextResponse.json({ message: "This should not be reached" });
}
