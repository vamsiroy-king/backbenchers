"use client";

import { Button } from "@/components/ui/button";

export default function SentryTestPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-6">
            <h1 className="text-3xl font-bold">Sentry Integration Test</h1>
            <p className="text-zinc-400">Click the button below to trigger a test error.</p>

            <Button
                variant="default"
                onClick={() => {
                    // @ts-ignore
                    myUndefinedFunction();
                }}
            >
                Throw 'myUndefinedFunction' Error
            </Button>

            <p className="text-sm text-zinc-500 mt-4 max-w-md text-center">
                Note: In development mode, Next.js 'Error Overlay' will pop up.
                This is normal. Check your Sentry Dashboard to see if the error was reported.
            </p>
        </div>
    );
}
