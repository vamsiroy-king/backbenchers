// App Store - Global UI state (loading, notifications, modals)
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface AppState {
    isLoading: boolean;
    loadingMessage: string;
    toasts: Toast[];

    // Actions
    setLoading: (loading: boolean, message?: string) => void;
    showToast: (type: ToastType, message: string) => void;
    dismissToast: (id: string) => void;
    clearToasts: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    isLoading: false,
    loadingMessage: '',
    toasts: [],

    setLoading: (isLoading, loadingMessage = 'Loading...') =>
        set({ isLoading, loadingMessage }),

    showToast: (type, message) => {
        const id = crypto.randomUUID();
        const toast: Toast = { id, type, message };

        set({ toasts: [...get().toasts, toast] });

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            get().dismissToast(id);
        }, 4000);
    },

    dismissToast: (id) =>
        set({ toasts: get().toasts.filter(t => t.id !== id) }),

    clearToasts: () => set({ toasts: [] }),
}));

// Convenience functions
export const toast = {
    success: (message: string) => useAppStore.getState().showToast('success', message),
    error: (message: string) => useAppStore.getState().showToast('error', message),
    info: (message: string) => useAppStore.getState().showToast('info', message),
    warning: (message: string) => useAppStore.getState().showToast('warning', message),
};
