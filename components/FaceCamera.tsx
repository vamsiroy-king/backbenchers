"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, CheckCircle, X, Sun, User, RotateCcw, Check, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Face detection status types
type FaceStatus =
    | "loading"      // Loading face detection models
    | "no_camera"    // Camera access denied
    | "no_face"      // No face detected
    | "too_dark"     // Image too dark
    | "multiple"     // Multiple faces detected
    | "too_far"      // Face too small/far
    | "not_centered" // Face not centered
    | "perfect";     // Ready to capture

// Screen states
type ScreenState = "instructions" | "camera" | "preview" | "uploading";

interface FaceCameraProps {
    onCapture: (imageData: string) => void;
    onCancel: () => void;
    shape?: "circle" | "square";
    instructions?: boolean;
}

// Constants
const MAX_RETAKES = 3;
const MIN_FACE_SIZE = 0.06; // 6% of frame - medium distance (half arm length)
const MAX_FACE_SIZE = 0.45; // 45% of frame - not too close
const BRIGHTNESS_THRESHOLD = 40;
const DEBOUNCE_THRESHOLD = 3;

// Helper to check image brightness
const checkBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    return sum / (imageData.width * imageData.height);
};

export default function FaceCamera({
    onCapture,
    onCancel,
    shape = "circle",
    instructions = true
}: FaceCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // States
    const [screenState, setScreenState] = useState<ScreenState>(instructions ? "instructions" : "camera");
    const [status, setStatus] = useState<FaceStatus>("loading");
    const [isCapturing, setIsCapturing] = useState(false);
    const [faceApiLoaded, setFaceApiLoaded] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [retakeCount, setRetakeCount] = useState(0);
    const [pulseAnimation, setPulseAnimation] = useState(false);
    const faceApiRef = useRef<any>(null);

    // Debounce status changes
    const statusCountRef = useRef<{ status: FaceStatus; count: number }>({ status: "loading", count: 0 });

    const updateStatusWithDebounce = (newStatus: FaceStatus) => {
        if (statusCountRef.current.status === newStatus) {
            statusCountRef.current.count++;
            if (statusCountRef.current.count >= DEBOUNCE_THRESHOLD) {
                setStatus(prevStatus => {
                    if (prevStatus !== newStatus) {
                        // Trigger pulse animation on status change
                        setPulseAnimation(true);
                        setTimeout(() => setPulseAnimation(false), 500);
                    }
                    return newStatus;
                });
            }
        } else {
            statusCountRef.current = { status: newStatus, count: 1 };
        }
    };

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const faceapi = await import("@vladmandic/face-api");
                faceApiRef.current = faceapi;
                const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                ]);
                setFaceApiLoaded(true);
            } catch (err) {
                console.error("Failed to load face detection:", err);
                setFaceApiLoaded(true); // Fallback
            }
        };
        loadModels();
        return () => { stopCamera(); };
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    startFaceDetection();
                };
            }
        } catch (err) {
            setStatus("no_camera");
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Face detection loop
    const startFaceDetection = useCallback(async () => {
        if (!faceApiRef.current || !videoRef.current) {
            setStatus("perfect");
            return;
        }
        const faceapi = faceApiRef.current;
        const video = videoRef.current;

        detectionIntervalRef.current = setInterval(async () => {
            if (!video || video.readyState !== 4) return;

            try {
                // Brightness check
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const avgBrightness = checkBrightness(imageData);
                    setBrightness(avgBrightness);

                    if (avgBrightness < BRIGHTNESS_THRESHOLD) {
                        updateStatusWithDebounce("too_dark");
                        return;
                    }
                }

                // Face detection
                const detections = await faceapi.detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
                );

                if (detections.length === 0) {
                    updateStatusWithDebounce("no_face");
                } else if (detections.length > 1) {
                    updateStatusWithDebounce("multiple");
                } else {
                    const face = detections[0].box;
                    const faceArea = (face.width * face.height) / (video.videoWidth * video.videoHeight);

                    // Check centering (face center should be within middle 40% of frame)
                    const faceCenterX = (face.x + face.width / 2) / video.videoWidth;
                    const faceCenterY = (face.y + face.height / 2) / video.videoHeight;
                    const isCentered = faceCenterX > 0.3 && faceCenterX < 0.7 && faceCenterY > 0.25 && faceCenterY < 0.75;

                    if (faceArea < MIN_FACE_SIZE) {
                        updateStatusWithDebounce("too_far");
                    } else if (!isCentered) {
                        updateStatusWithDebounce("not_centered");
                    } else {
                        updateStatusWithDebounce("perfect");
                    }
                }
            } catch (err) {
                // Silently ignore
            }
        }, 150); // Faster detection for smoother UX
    }, [faceApiLoaded]);

    // Capture photo
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;

        canvas.width = 600;
        canvas.height = 600;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.translate(600, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, x, y, size, size, 0, 0, 600, 600);

            // Add timestamp watermark (security feature)
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.font = "12px monospace";
            ctx.fillText(`BB-${Date.now()}`, 10, 590);

            const imageData = canvas.toDataURL("image/jpeg", 0.9);
            setCapturedImage(imageData);
            setScreenState("preview");
            stopCamera();
        }
        setIsCapturing(false);
    };

    // Confirm and submit
    const handleConfirm = () => {
        if (capturedImage) {
            setScreenState("uploading");
            onCapture(capturedImage);
        }
    };

    // Retake photo
    const handleRetake = () => {
        if (retakeCount >= MAX_RETAKES - 1) {
            // Max retakes reached
            return;
        }
        setRetakeCount(prev => prev + 1);
        setCapturedImage(null);
        setScreenState("camera");
        startCamera();
    };

    // Start camera when ready
    useEffect(() => {
        if (faceApiLoaded && screenState === "camera") {
            startCamera();
        }
    }, [faceApiLoaded, screenState, startCamera]);

    // Get status UI
    const getStatusUI = () => {
        switch (status) {
            case "loading":
                return { color: "gray", message: "Loading camera...", icon: <Loader2 className="h-4 w-4 animate-spin" />, canCapture: false };
            case "no_camera":
                return { color: "red", message: "Camera access denied", icon: <AlertCircle className="h-4 w-4" />, canCapture: false };
            case "no_face":
                return { color: "orange", message: "No face detected", icon: <User className="h-4 w-4" />, canCapture: false };
            case "too_dark":
                return { color: "orange", message: "Too dark - need more light", icon: <Sun className="h-4 w-4" />, canCapture: false };
            case "multiple":
                return { color: "red", message: "Only one face allowed", icon: <AlertCircle className="h-4 w-4" />, canCapture: false };
            case "too_far":
                return { color: "orange", message: "Move closer to camera", icon: <User className="h-4 w-4" />, canCapture: false };
            case "not_centered":
                return { color: "orange", message: "Center your face", icon: <User className="h-4 w-4" />, canCapture: false };
            case "perfect":
                return { color: "green", message: "Perfect! Ready to capture", icon: <CheckCircle className="h-4 w-4" />, canCapture: true };
            default:
                return { color: "gray", message: "", icon: null, canCapture: false };
        }
    };

    const statusUI = getStatusUI();
    const borderColor = statusUI.color === "green" ? "border-emerald-500"
        : statusUI.color === "orange" ? "border-orange-500"
            : statusUI.color === "red" ? "border-red-500"
                : "border-gray-500";
    const glowColor = statusUI.color === "green" ? "rgba(16, 185, 129, 0.6)"
        : statusUI.color === "orange" ? "rgba(251, 146, 60, 0.4)"
            : statusUI.color === "red" ? "rgba(239, 68, 68, 0.4)"
                : "transparent";

    // ==================== INSTRUCTIONS SCREEN ====================
    if (screenState === "instructions") {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
                <div className="flex-shrink-0 pt-3 px-4 pb-2 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                    <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <X className="h-5 w-5 text-white" />
                    </button>
                    <span className="text-white text-sm font-semibold">Profile Selfie</span>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto px-4">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Camera className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h2 className="text-white text-lg font-bold mb-1">Selfie Guidelines</h2>
                        <p className="text-gray-400 text-xs">Follow these for best results</p>
                    </div>

                    <div className="space-y-2 mb-4 max-w-sm mx-auto">
                        {[
                            { icon: "📸", text: "Take a clear selfie of your face" },
                            { icon: "👤", text: "Only your face should be visible" },
                            { icon: "💡", text: "Ensure good lighting on your face" },
                            { icon: "📐", text: "Keep face centered in the circle" },
                            { icon: "🚫", text: "No sunglasses, masks or filters" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2"
                            >
                                <span className="text-base">{item.icon}</span>
                                <span className="text-white text-sm">{item.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-2.5 mb-4 max-w-sm mx-auto">
                        <p className="text-red-300 text-xs text-center font-medium">
                            ⚠️ This photo is <strong>permanent</strong> and cannot be changed.
                        </p>
                    </div>
                </div>

                <div className="flex-shrink-0 p-4 bg-black border-t border-white/10">
                    <div className="max-w-sm mx-auto">
                        <Button
                            onClick={() => setScreenState("camera")}
                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm"
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            I Understand, Open Camera
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== PREVIEW SCREEN ====================
    if (screenState === "preview" && capturedImage) {
        const remainingRetakes = MAX_RETAKES - retakeCount - 1;

        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
                <div className="flex-shrink-0 pt-3 px-4 pb-2 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                    <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <X className="h-5 w-5 text-white" />
                    </button>
                    <span className="text-white text-sm font-semibold">Confirm Photo</span>
                    <div className="w-10" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    {/* Preview image */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <img
                            src={capturedImage}
                            alt="Captured selfie"
                            className="w-64 h-64 object-cover rounded-full border-4 border-emerald-500"
                        />
                        <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }} />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-white text-lg font-semibold mb-1">Does this look good?</p>
                        <p className="text-gray-400 text-sm">Make sure your face is clearly visible</p>
                    </motion.div>
                </div>

                <div className="flex-shrink-0 p-4 bg-black border-t border-white/10">
                    <div className="max-w-sm mx-auto space-y-3">
                        <Button
                            onClick={handleConfirm}
                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Use This Photo
                        </Button>

                        {remainingRetakes > 0 ? (
                            <Button
                                onClick={handleRetake}
                                variant="outline"
                                className="w-full h-12 bg-transparent border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl text-sm"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Retake ({remainingRetakes} left)
                            </Button>
                        ) : (
                            <p className="text-orange-400 text-xs text-center">
                                No retakes remaining. Please use this photo or contact support.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ==================== UPLOADING SCREEN ====================
    if (screenState === "uploading") {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <Loader2 className="h-12 w-12 text-emerald-500" />
                </motion.div>
                <p className="text-white mt-4 font-semibold">Uploading your photo...</p>
                <p className="text-gray-400 text-sm mt-1">Please wait</p>
            </div>
        );
    }

    // ==================== CAMERA SCREEN ====================
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pt-safe px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                <button
                    onClick={() => { stopCamera(); onCancel(); }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                >
                    <X className="h-5 w-5 text-white" />
                </button>
                <div className="text-center">
                    <span className="text-white text-sm font-semibold">Profile Selfie</span>
                </div>
                <div className="w-10" />
            </div>

            {/* Camera area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
                <div className="relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-64 h-64 object-cover bg-gray-900 rounded-full"
                        style={{ transform: "scaleX(-1)" }}
                    />

                    {/* Animated pulsing border */}
                    <motion.div
                        animate={pulseAnimation ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 rounded-full border-4 ${borderColor} pointer-events-none transition-all duration-300`}
                        style={{
                            boxShadow: `0 0 ${status === 'perfect' ? '40px' : '20px'} ${glowColor}`,
                        }}
                    />

                    {/* Inner face guide circle - animated */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        animate={status === 'perfect' ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <div className={`w-44 h-44 border-2 ${status === 'perfect' ? 'border-emerald-400/50' : 'border-white/20'} border-dashed rounded-full transition-colors duration-300`} />
                    </motion.div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Status badge with animation */}
                <motion.div
                    key={status}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`mt-4 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${statusUI.color === "green" ? "bg-emerald-500 text-white" :
                            statusUI.color === "orange" ? "bg-orange-500 text-white" :
                                statusUI.color === "red" ? "bg-red-500 text-white" :
                                    "bg-gray-600 text-white"
                        }`}
                >
                    {statusUI.icon}
                    <span>{statusUI.message}</span>
                </motion.div>

                {/* Attempt counter */}
                <p className="text-gray-500 text-xs mt-2">
                    Attempt {retakeCount + 1} of {MAX_RETAKES}
                </p>
            </div>

            {/* Bottom section */}
            <div
                className="flex-shrink-0 px-6 pb-6 pt-4 bg-gradient-to-t from-black to-transparent"
                style={{ paddingBottom: 'max(1.5rem, calc(80px + env(safe-area-inset-bottom)))' }}
            >
                <Button
                    onClick={handleCapture}
                    disabled={!statusUI.canCapture || isCapturing}
                    className={`w-full h-14 font-bold rounded-2xl text-base transition-all ${statusUI.canCapture
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                >
                    {isCapturing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Capturing...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-5 w-5" />
                            {statusUI.canCapture ? "Capture Photo" : "Position Your Face"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
