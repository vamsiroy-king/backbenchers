"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/services/auth.service";
import { studentService } from "@/lib/services";
import { RatingModal } from "@/components/RatingModal";

interface PendingRating {
    transactionId: string;
    merchantId: string;
    merchantName: string;
}

interface GlobalRatingContextType {
    checkForPendingRatings: () => void;
}

const GlobalRatingContext = createContext<GlobalRatingContextType>({
    checkForPendingRatings: () => { },
});

export function useGlobalRating() {
    return useContext(GlobalRatingContext);
}

export function GlobalRatingProvider({ children }: { children: ReactNode }) {
    const [studentId, setStudentId] = useState<string | null>(null);
    const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Get student ID on mount
    useEffect(() => {
        async function init() {
            const hasSession = await authService.hasActiveSession();
            if (hasSession) {
                const profile = await studentService.getMyProfile();
                if (profile.success && profile.data) {
                    setStudentId(profile.data.id);
                }
            }
        }
        init();
    }, []);

    // Check for pending ratings (including dismissed ones after 24 hours)
    const checkForPendingRatings = async () => {
        if (!studentId) return;

        // First, check for never-dismissed ratings
        const { data: newRating } = await supabase
            .from("pending_ratings")
            .select("*")
            .eq("student_id", studentId)
            .is("dismissed_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (newRating) {
            setPendingRating({
                transactionId: newRating.transaction_id,
                merchantId: newRating.merchant_id,
                merchantName: newRating.merchant_name,
            });
            setShowModal(true);
            return;
        }

        // If no active ratings, check for dismissed ratings older than 24 hours (retry logic)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: retryRating } = await supabase
            .from("pending_ratings")
            .select("*")
            .eq("student_id", studentId)
            .not("dismissed_at", "is", null)
            .lt("dismissed_at", twentyFourHoursAgo)  // Dismissed more than 24 hours ago
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (retryRating) {
            // Reset dismissed_at to null so it shows again
            await supabase
                .from("pending_ratings")
                .update({ dismissed_at: null })
                .eq("transaction_id", retryRating.transaction_id);

            setPendingRating({
                transactionId: retryRating.transaction_id,
                merchantId: retryRating.merchant_id,
                merchantName: retryRating.merchant_name,
            });
            setShowModal(true);
        }
    };

    // Check on mount and when student ID changes
    useEffect(() => {
        if (studentId) {
            checkForPendingRatings();
        }
    }, [studentId]);

    // 🔥 REAL-TIME: Subscribe to new pending ratings
    useEffect(() => {
        if (!studentId) return;

        const channel = supabase
            .channel(`global-rating-${studentId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "pending_ratings",
                    filter: `student_id=eq.${studentId}`,
                },
                (payload) => {
                    console.log("[GlobalRating] 🔥 New pending rating:", payload);
                    if (payload.new) {
                        setPendingRating({
                            transactionId: payload.new.transaction_id,
                            merchantId: payload.new.merchant_id,
                            merchantName: payload.new.merchant_name,
                        });
                        setShowModal(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [studentId]);

    // Dismiss rating
    const dismissRating = async () => {
        if (pendingRating) {
            await supabase
                .from("pending_ratings")
                .update({ dismissed_at: new Date().toISOString() })
                .eq("transaction_id", pendingRating.transactionId);
        }
        setShowModal(false);
        setPendingRating(null);
    };

    // Delete rating after submission
    const deleteRating = async () => {
        if (pendingRating) {
            await supabase
                .from("pending_ratings")
                .delete()
                .eq("transaction_id", pendingRating.transactionId);
        }
        setShowModal(false);
        setPendingRating(null);
    };

    return (
        <GlobalRatingContext.Provider value={{ checkForPendingRatings }}>
            {children}

            {/* Global Rating Modal - Appears on ANY screen */}
            {showModal && pendingRating && studentId && (
                <RatingModal
                    isOpen={showModal}
                    onClose={dismissRating}
                    transactionId={pendingRating.transactionId}
                    merchantId={pendingRating.merchantId}
                    merchantName={pendingRating.merchantName}
                    studentId={studentId}
                    onRatingSubmitted={deleteRating}
                />
            )}
        </GlobalRatingContext.Provider>
    );
}
