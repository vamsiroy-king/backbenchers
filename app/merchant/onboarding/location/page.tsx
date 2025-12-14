"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const DAYS = [
    { id: 'monday', label: 'Monday', short: 'Mon' },
    { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { id: 'thursday', label: 'Thursday', short: 'Thu' },
    { id: 'friday', label: 'Friday', short: 'Fri' },
    { id: 'saturday', label: 'Saturday', short: 'Sat' },
    { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_SLOTS = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
    "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

interface DayTiming {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
}

export default function LocationPage() {
    const router = useRouter();

    const [sameEveryDay, setSameEveryDay] = useState(true);
    const [commonTiming, setCommonTiming] = useState({ openTime: "9:00 AM", closeTime: "10:00 PM" });
    const [dayTimings, setDayTimings] = useState<Record<string, DayTiming>>(() => {
        const initial: Record<string, DayTiming> = {};
        DAYS.forEach(day => {
            initial[day.id] = { isOpen: true, openTime: "9:00 AM", closeTime: "10:00 PM" };
        });
        return initial;
    });

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedHours = localStorage.getItem('merchant_hours');
        if (savedHours) {
            try {
                const data = JSON.parse(savedHours);
                if (data.sameEveryDay !== undefined) setSameEveryDay(data.sameEveryDay);
                if (data.commonTiming) setCommonTiming(data.commonTiming);
                if (data.dayTimings) setDayTimings(data.dayTimings);
            } catch (e) {
                console.error('Error loading saved hours:', e);
            }
        }
    }, []);

    const handleContinue = () => {
        // Save operating hours
        localStorage.setItem('merchant_hours', JSON.stringify({
            sameEveryDay,
            commonTiming,
            dayTimings
        }));

        router.push("/merchant/onboarding/documents");
    };

    const toggleDayOpen = (dayId: string) => {
        setDayTimings(prev => ({
            ...prev,
            [dayId]: { ...prev[dayId], isOpen: !prev[dayId].isOpen }
        }));
    };

    const updateDayTiming = (dayId: string, field: 'openTime' | 'closeTime', value: string) => {
        setDayTimings(prev => ({
            ...prev,
            [dayId]: { ...prev[dayId], [field]: value }
        }));
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-lg mx-auto min-h-screen">
                <div className="min-h-screen overflow-y-auto pt-6 pb-8 px-5 scrollbar-hide">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/merchant/onboarding/business">
                            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-extrabold">Store Timings</h1>
                            <p className="text-xs text-gray-500">Step 2 of 3</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                    </div>

                    {/* Timings Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <p className="font-semibold">When is your store open?</p>
                        </div>

                        {/* Same every day toggle */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-sm font-medium mb-3">Are your timings same every day?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSameEveryDay(true)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${sameEveryDay ? 'bg-primary text-white' : 'bg-white text-gray-600 shadow-sm'
                                        }`}
                                >
                                    Yes, Same
                                </button>
                                <button
                                    onClick={() => setSameEveryDay(false)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${!sameEveryDay ? 'bg-primary text-white' : 'bg-white text-gray-600 shadow-sm'
                                        }`}
                                >
                                    No, Different
                                </button>
                            </div>
                        </div>

                        {/* Same every day timings */}
                        {sameEveryDay && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-primary/10 rounded-2xl p-4"
                            >
                                <p className="text-xs font-semibold text-gray-500 mb-3">EVERY DAY</p>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={commonTiming.openTime}
                                        onChange={(e) => setCommonTiming({ ...commonTiming, openTime: e.target.value })}
                                        className="flex-1 h-12 bg-white rounded-xl px-3 text-sm font-medium outline-none"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                    <span className="text-gray-400">to</span>
                                    <select
                                        value={commonTiming.closeTime}
                                        onChange={(e) => setCommonTiming({ ...commonTiming, closeTime: e.target.value })}
                                        className="flex-1 h-12 bg-white rounded-xl px-3 text-sm font-medium outline-none"
                                    >
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        {/* Day by day timings */}
                        {!sameEveryDay && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                {DAYS.map(day => (
                                    <div
                                        key={day.id}
                                        className={`rounded-xl p-3 ${dayTimings[day.id].isOpen ? 'bg-gray-50' : 'bg-red-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-sm">{day.label}</span>
                                            <button
                                                onClick={() => toggleDayOpen(day.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${dayTimings[day.id].isOpen
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-red-100 text-red-500'
                                                    }`}
                                            >
                                                {dayTimings[day.id].isOpen ? 'Open' : 'Closed'}
                                            </button>
                                        </div>

                                        {dayTimings[day.id].isOpen && (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={dayTimings[day.id].openTime}
                                                    onChange={(e) => updateDayTiming(day.id, 'openTime', e.target.value)}
                                                    className="flex-1 h-10 bg-white rounded-lg px-2 text-xs font-medium outline-none"
                                                >
                                                    {TIME_SLOTS.map(time => (
                                                        <option key={time} value={time}>{time}</option>
                                                    ))}
                                                </select>
                                                <span className="text-gray-400 text-xs">to</span>
                                                <select
                                                    value={dayTimings[day.id].closeTime}
                                                    onChange={(e) => updateDayTiming(day.id, 'closeTime', e.target.value)}
                                                    className="flex-1 h-10 bg-white rounded-lg px-2 text-xs font-medium outline-none"
                                                >
                                                    {TIME_SLOTS.map(time => (
                                                        <option key={time} value={time}>{time}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Continue Button */}
                    <motion.div className="mt-8">
                        <Button
                            onClick={handleContinue}
                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base"
                        >
                            Continue to Photos
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
