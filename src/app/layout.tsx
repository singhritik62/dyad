import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { Toaster } from "sonner";
import { TitleBar } from "./TitleBar";
import { useEffect, type ReactNode } from "react";
import { useRunApp } from "@/hooks/useRunApp";
import { useAtomValue, useSetAtom } from "jotai";
import { previewModeAtom, selectedAppIdAtom } from "@/atoms/appAtoms";
import { useSettings } from "@/hooks/useSettings";
import type { ZoomLevel } from "@/lib/schemas";
import { selectedComponentsPreviewAtom } from "@/atoms/previewAtoms";
import { chatInputValueAtom } from "@/atoms/chatAtoms";

const DEFAULT_ZOOM_LEVEL: ZoomLevel = "100";

export default function RootLayout({ children }: { children: ReactNode }) {
  const { refreshAppIframe } = useRunApp();
  const previewMode = useAtomValue(previewModeAtom);
  const { settings } = useSettings();
  const setSelectedComponentsPreview = useSetAtom(selectedComponentsPreviewAtom);
  const setChatInput = useSetAtom(chatInputValueAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);

  /** Handle zoom level update for Electron apps */
  useEffect(() => {
    const zoomLevel = settings?.zoomLevel ?? DEFAULT_ZOOM_LEVEL;
    const electronApi = window.electron;

    if (!electronApi?.webFrame?.setZoomFactor) return;

    electronApi.webFrame.setZoomFactor(Number(zoomLevel) / 100);

    return () => {
      electronApi.webFrame?.setZoomFactor(Number(DEFAULT_ZOOM_LEVEL) / 100);
    };
  }, [settings]);

  /** Custom refresh when pressing Cmd/Ctrl + R */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (previewMode === "preview") {
          refreshAppIframe();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [refreshAppIframe, previewMode]);

  /** Reset preview selections on app switch */
  useEffect(() => {
    setChatInput("");
    setSelectedComponentsPreview([]);
  }, [selectedAppId]);

  return (
    <ThemeProvider>
      <DeepLinkProvider>
        <SidebarProvider>
          <TitleBar />

          {/* Sidebar only shown outside preview */}
          {previewMode !== "preview" && <AppSidebar />}

          <div
            id="layout-main-content-container"
            className="flex h-screenish w-full overflow-x-hidden mt-12 mb-4 mr-4 
                       border-t border-l border-border rounded-lg bg-background"
          >
            {children}
          </div>

          <Toaster richColors />
        </SidebarProvider>
      </DeepLinkProvider>
    </ThemeProvider>
  );
}
