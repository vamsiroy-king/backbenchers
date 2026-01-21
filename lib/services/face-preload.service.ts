// Face Detection Preloader - Loads face-api.js models early for faster camera startup
// Import this and call preloadFaceDetection() on app init to eliminate camera lag

let isLoaded = false;
let isLoading = false;
let faceApiInstance: any = null;

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";

// Preload face detection models (call early in app lifecycle)
export const preloadFaceDetection = async (): Promise<void> => {
    if (isLoaded || isLoading) return;

    isLoading = true;
    try {
        const faceapi = await import("@vladmandic/face-api");
        faceApiInstance = faceapi;

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        isLoaded = true;
        console.log("✅ Face detection models preloaded");
    } catch (err) {
        console.error("Failed to preload face detection:", err);
        // Don't block - allow fallback in FaceCamera
    } finally {
        isLoading = false;
    }
};

// Check if models are already loaded
export const isFaceDetectionReady = (): boolean => isLoaded;

// Get the preloaded face-api instance
export const getFaceApi = (): any => faceApiInstance;

// Check if currently loading
export const isFaceDetectionLoading = (): boolean => isLoading;
