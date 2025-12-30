"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, CheckCircle, X, Sun, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Face detection status types
type FaceStatus =
    | "loading"      // Loading face detection models
    | "no_camera"    // Camera access denied
    | "no_face"      // No face detected
    | "too_dark"     // Image too dark
    | "multiple"     // Multiple faces detected
    | "too_far"      // Face too small/far
    | "perfect";     // Ready to capture

interface FaceCameraProps {
    onCapture: (imageData: string) => void;
    onCancel: () => void;
    shape?: "circle" | "square";
    instructions?: boolean;
}

// Helper to check image brightness
const checkBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        // Calculate perceived brightness using luminosity formula
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

    const [status, setStatus] = useState<FaceStatus>("loading");
    const [isCapturing, setIsCapturing] = useState(false);
    const [showInstructions, setShowInstructions] = useState(instructions);
    const [faceApiLoaded, setFaceApiLoaded] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const faceApiRef = useRef<any>(null);

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Dynamic import to reduce bundle size
                const faceapi = await import("@vladmandic/face-api");
                faceApiRef.current = faceapi;

                // Load models from CDN (small, optimized models)
                const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                ]);

                setFaceApiLoaded(true);
                console.log("Face detection models loaded successfully");
            } catch (err) {
                console.error("Failed to load face detection models:", err);
                // Fallback: allow capture without face detection
                setFaceApiLoaded(true);
            }
        };

        loadModels();

        return () => {
            stopCamera();
        };
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 640 }
                }
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
            console.error("Camera error:", err);
            setStatus("no_camera");
        }
    }, []);

    // Stop camera and detection
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

    // Real-time face detection loop
    const startFaceDetection = useCallback(async () => {
        if (!faceApiRef.current || !videoRef.current) {
            setStatus("perfect"); // Fallback if models didn't load
            return;
        }

        const faceapi = faceApiRef.current;
        const video = videoRef.current;

        detectionIntervalRef.current = setInterval(async () => {
            if (!video || video.readyState !== 4) return;

            try {
                // Check brightness first
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const avgBrightness = checkBrightness(imageData);
                    setBrightness(avgBrightness);

                    if (avgBrightness < 40) {
                        setStatus("too_dark");
                        return;
                    }
                }

                // Detect faces
                const detections = await faceapi.detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    })
                );

                if (detections.length === 0) {
                    setStatus("no_face");
                } else if (detections.length > 1) {
                    setStatus("multiple");
                } else {
                    // Check face size (should be at least 20% of frame)
                    const face = detections[0].box;
                    const faceArea = (face.width * face.height) / (video.videoWidth * video.videoHeight);

                    if (faceArea < 0.08) {
                        setStatus("too_far");
                    } else {
                        setStatus("perfect");
                    }
                }
            } catch (err) {
                // Silently ignore detection errors
            }
        }, 200);
    }, [faceApiLoaded]);

    // Capture photo
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Square crop from center
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;

        canvas.width = 600;
        canvas.height = 600;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            // Mirror the image (selfie mode)
            ctx.translate(600, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, x, y, size, size, 0, 0, 600, 600);

            const imageData = canvas.toDataURL("image/jpeg", 0.9);

            stopCamera();
            onCapture(imageData);
        }

        setIsCapturing(false);
    };

    // Start camera when ready and instructions dismissed
    useEffect(() => {
        if (faceApiLoaded && !showInstructions) {
            startCamera();
        }
    }, [faceApiLoaded, showInstructions, startCamera]);

    // Get status message and styling
    const getStatusUI = () => {
        switch (status) {
            case "loading":
                return {
                    color: "gray",
                    message: "Loading camera...",
                    icon: <Loader2 className="h-4 w-4 animate-spin" />,
                    canCapture: false
                };
            case "no_camera":
                return {
                    color: "red",
                    message: "Camera access denied",
                    icon: <AlertCircle className="h-4 w-4" />,
                    canCapture: false
                };
            case "no_face":
                return {
                    color: "orange",
                    message: "Position your face in the frame",
                    icon: <User className="h-4 w-4" />,
                    canCapture: false
                };
            case "too_dark":
                return {
                    color: "orange",
                    message: "Too dark - find better lighting",
                    icon: <Sun className="h-4 w-4" />,
                    canCapture: false
                };
            case "multiple":
                return {
                    color: "red",
                    message: "Only one face allowed",
                    icon: <AlertCircle className="h-4 w-4" />,
                    canCapture: false
                };
            case "too_far":
                return {
                    color: "orange",
                    message: "Move closer to camera",
                    icon: <User className="h-4 w-4" />,
                    canCapture: false
                };
            case "perfect":
                return {
                    color: "green",
                    message: "Perfect! Ready to capture",
                    icon: <CheckCircle className="h-4 w-4" />,
                    canCapture: true
                };
            default:
                return { color: "gray", message: "", icon: null, canCapture: false };
        }
    };

    const statusUI = getStatusUI();
    const borderColor = statusUI.color === "green" ? "border-emerald-500"
        : statusUI.color === "orange" ? "border-orange-500"
            : statusUI.color === "red" ? "border-red-500"
                : "border-gray-500";
    const glowColor = statusUI.color === "green" ? "rgba(16, 185, 129, 0.4)"
        : statusUI.color === "orange" ? "rgba(251, 146, 60, 0.4)"
            : statusUI.color === "red" ? "rgba(239, 68, 68, 0.4)"
                : "transparent";

    // Instructions screen
    if (showInstructions) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-6"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h2 className="text-white text-xl font-bold mb-1">Selfie Guidelines</h2>
                    <p className="text-gray-400 text-sm">Follow these for best results</p>
                </motion.div>

                <div className="space-y-3 mb-6 w-full max-w-sm">
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
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5"
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-white text-sm">{item.text}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-6 w-full max-w-sm">
                    <p className="text-red-300 text-sm text-center font-medium">
                        ⚠️ This photo is <strong>permanent</strong> and cannot be changed.
                    </p>
                </div>

                <Button
                    onClick={() => setShowInstructions(false)}
                    className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-base"
                >
                    <Camera className="mr-2 h-5 w-5" />
                    I Understand, Open Camera
                </Button>
            </div>
        );
    }

    // Camera screen
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 pt-12 px-4 pb-4 flex items-center justify-between">
                <button onClick={() => { stopCamera(); onCancel(); }}>
                    <X className="h-6 w-6 text-white" />
                </button>
                <span className="text-white text-sm font-semibold">Profile Selfie</span>
                <div className="w-6" />
            </div>

            {/* Camera preview */}
            <div className="relative mb-6">
                <div className="relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-72 h-72 object-cover bg-black ${shape === "circle" ? "rounded-full" : "rounded-2xl"}`}
                        style={{ transform: "scaleX(-1)" }}
                    />

                    {/* Dynamic border */}
                    <div
                        className={`absolute inset-0 ${shape === "circle" ? "rounded-full" : "rounded-2xl"} border-4 ${borderColor} pointer-events-none transition-all duration-300`}
                        style={{ boxShadow: `0 0 30px ${glowColor}` }}
                    />

                    {/* Face guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-52 h-52 border-2 border-white/20 border-dashed ${shape === "circle" ? "rounded-full" : "rounded-2xl"}`} />
                    </div>

                    {/* Status badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusUI.color === "green" ? "bg-emerald-500/90 text-white" :
                            statusUI.color === "orange" ? "bg-orange-500/90 text-white" :
                                statusUI.color === "red" ? "bg-red-500/90 text-white" :
                                    "bg-gray-500/90 text-white"
                        }`}>
                        {statusUI.icon}
                        <span>{status === "perfect" ? "Ready" : status === "no_face" ? "No Face" :
                            status === "too_dark" ? "Dark" : status === "multiple" ? "Multiple" :
                                status === "too_far" ? "Far" : "..."}</span>
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Status message */}
            <p className={`text-sm mb-6 text-center font-medium ${statusUI.color === "green" ? "text-emerald-400" :
                    statusUI.color === "orange" ? "text-orange-400" :
                        statusUI.color === "red" ? "text-red-400" : "text-gray-400"
                }`}>
                {statusUI.message}
            </p>

            {/* Capture button */}
            <Button
                onClick={handleCapture}
                disabled={!statusUI.canCapture || isCapturing}
                className={`h-14 px-10 font-bold rounded-full text-base transition-all ${statusUI.canCapture
                        ? "bg-white text-black hover:bg-gray-100"
                        : "bg-white/30 text-white/50 cursor-not-allowed"
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
                        {statusUI.canCapture ? "Capture" : "Position Face"}
                    </>
                )}
            </Button>

            <p className="text-orange-400 text-xs text-center mt-6">
                Photo cannot be changed after capture
            </p>
        </div>
    );
}
