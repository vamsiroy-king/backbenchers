import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Use service role key to check OTP securely
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400, headers: corsHeaders });
        }

        // Verify OTP from database
        const { data, error } = await supabase
            .from("otp_verifications")
            .select("*")
            .eq("email", email.toLowerCase())
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400, headers: corsHeaders });
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 400, headers: corsHeaders });
        }

        // Check if matches
        if (data.otp !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400, headers: corsHeaders });
        }

        // valid, so delete it
        await supabase
            .from("otp_verifications")
            .delete()
            .eq("email", email.toLowerCase());

        return NextResponse.json({ success: true, message: "OTP verified correctly" }, { headers: corsHeaders });

    } catch (error: any) {
        console.error("OTP Verify Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { 
            status: 500, 
            headers: { "Access-Control-Allow-Origin": "*" } 
        });
    }
}
