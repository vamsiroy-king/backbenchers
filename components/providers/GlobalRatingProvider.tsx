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

    // Check for pending ratings
    const checkForPendingRatings = async () => {
        if (!studentId) return;

        const { data } = await supabase
            .from("pending_ratings")
            .select("*")
            .eq("student_id", studentId)
            .is("dismissed_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setPendingRating({
                transactionId: data.transaction_id,
                merchantId: data.merchant_id,
                merchantName: data.merchant_name,
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
