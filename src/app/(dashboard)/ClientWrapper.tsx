'use client';

import { LearningStateProvider } from "@/lib/contexts/LearningStateContext";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <LearningStateProvider>
            {children}
        </LearningStateProvider>
    );
}
