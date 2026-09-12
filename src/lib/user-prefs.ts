import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fileforge-user-prefs";

export interface RecentFile {
  name: string;
  type: "pdf" | "image";
  size: number;
  timestamp: number;
  tool: string;
}

export interface UserPrefs {
  name: string;
  recentFiles: RecentFile[];
}

const EMPTY_PREFS: UserPrefs = { name: "", recentFiles: [] };

function readPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PREFS;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name ?? "",
      recentFiles: Array.isArray(parsed.recentFiles)
        ? parsed.recentFiles.slice(0, 5)
        : [],
    };
  } catch {
    return EMPTY_PREFS;
  }
}

function writePrefs(prefs: UserPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(readPrefs);

  useEffect(() => {
    const handler = () => setPrefs(readPrefs());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setName = useCallback((name: string) => {
    setPrefs((prev) => {
      const updated = { ...prev, name };
      writePrefs(updated);
      return updated;
    });
  }, []);

  const addRecentFile = useCallback(
    (file: { name: string; type: "pdf" | "image"; size: number; tool: string }) => {
      setPrefs((prev) => {
        const entry: RecentFile = { ...file, timestamp: Date.now() };
        const filtered = prev.recentFiles.filter((f) => f.name !== file.name);
        const updated = { ...prev, recentFiles: [entry, ...filtered].slice(0, 5) };
        writePrefs(updated);
        return updated;
      });
    },
    [],
  );

  const clearRecentFiles = useCallback(() => {
    setPrefs((prev) => {
      const updated = { ...prev, recentFiles: [] };
      writePrefs(updated);
      return updated;
    });
  }, []);

  return { prefs, setName, addRecentFile, clearRecentFiles };
}
