import { NextRequest, NextResponse } from "next/server";
import { EmailClient } from "@azure/communication-email";
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
// Use service role key to insert OTP securely bypassing RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400, headers: corsHeaders });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to Supabase using upsert
        const { error: dbError } = await supabase
            .from("otp_verifications")
            .upsert({ 
                email: email.toLowerCase(), 
                otp, 
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 10 * 60000).toISOString() // 10 minutes
            });

        if (dbError) {
            console.error("Database error saving OTP:", dbError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500, headers: corsHeaders });
        }

        // Use Azure Communication Services to send the email
        const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
        const senderAddress = process.env.AZURE_SENDER_EMAIL || "DoNotReply@<your-verified-domain>.azurecomm.net";

        if (!connectionString) {
            // In Dev mode or when Azure is not configured yet, just return success
            console.warn("AZURE_COMMUNICATION_CONNECTION_STRING is not set. OTP generated but not sent via Azure.");
            return NextResponse.json({ 
                success: true, 
                message: "Dev Mode: Azure not configured. OTP stored in DB.",
                dev_otp: process.env.NODE_ENV === "development" ? otp : undefined
            }, { headers: corsHeaders });
        }

        const client = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress: senderAddress,
            content: {
                subject: "Verify your College Email - Backbenchers",
                plainText: `Your verification code is ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 10px;">
                        <h2 style="color: #333;">College Email Verification</h2>
                        <p>Welcome to Backbenchers! Use the code below to verify your college email address:</p>
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #000; background: #fff; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</h1>
                        <p>This code will expire in 10 minutes.</p>
                        <p style="color: #888; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
                    </div>
                `,
            },
            recipients: {
                to: [{ address: email }],
            },
        };

        const poller = await client.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        if (result.status === "Succeeded") {
            return NextResponse.json({ success: true, message: "OTP sent successfully via Azure" }, { headers: corsHeaders });
        } else {
            console.error("Azure Email Send Failed:", result);
            return NextResponse.json({ error: "Failed to send email via Azure" }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error("OTP Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { 
            status: 500, 
            headers: { "Access-Control-Allow-Origin": "*" } 
        });
    }
}
