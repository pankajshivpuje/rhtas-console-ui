import { useState, useCallback, useEffect } from "react";
import type {
  PolicySession,
  ChatMessage,
  PolicyArtifacts,
  PolicyType,
  SessionSummary,
} from "./types";

export const STORAGE_KEY = "rhtas-policy-sessions";

const generateId = (): string =>
  `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptySession = (): PolicySession => ({
  id: generateId(),
  messages: [],
  currentArtifacts: null,
  artifactHistory: [],
  policyTypeFilter: "both",
  createdAt: new Date().toISOString(),
  title: "New Policy Session",
});

const loadSessions = (): PolicySession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PolicySession[];
  } catch {
    console.error("Failed to parse policy sessions from localStorage, starting fresh");
    return [];
  }
};

const saveSessions = (sessions: PolicySession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save policy sessions to localStorage:", e);
  }
};

export const usePolicySession = () => {
  const [allSessions, setAllSessions] = useState<PolicySession[]>(() => {
    const existing = loadSessions();
    if (existing.length > 0) return existing;
    return [createEmptySession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => allSessions[allSessions.length - 1].id,
  );

  const session = allSessions.find((s) => s.id === activeSessionId) ?? allSessions[allSessions.length - 1];

  useEffect(() => {
    saveSessions(allSessions);
  }, [allSessions]);

  const updateSession = useCallback(
    (updater: (s: PolicySession) => PolicySession) => {
      setAllSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? updater(s) : s)),
      );
    },
    [activeSessionId],
  );

  const appendMessage = useCallback(
    (message: ChatMessage) => {
      updateSession((s) => ({
        ...s,
        messages: [...s.messages, message],
        title:
          s.messages.length === 0 && message.role === "user"
            ? message.content.slice(0, 60)
            : s.title,
      }));
    },
    [updateSession],
  );

  const setArtifacts = useCallback(
    (artifacts: PolicyArtifacts) => {
      updateSession((s) => ({
        ...s,
        artifactHistory: s.currentArtifacts
          ? [...s.artifactHistory, s.currentArtifacts]
          : s.artifactHistory,
        currentArtifacts: artifacts,
      }));
    },
    [updateSession],
  );

  const setPolicyTypeFilter = useCallback(
    (filter: PolicyType) => {
      updateSession((s) => ({ ...s, policyTypeFilter: filter }));
    },
    [updateSession],
  );

  const newSession = useCallback(() => {
    const fresh = createEmptySession();
    setAllSessions((prev) => [...prev, fresh]);
    setActiveSessionId(fresh.id);
  }, []);

  const loadSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const sessions: SessionSummary[] = allSessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    messageCount: s.messages.length,
  }));

  return {
    session,
    sessions,
    appendMessage,
    setArtifacts,
    setPolicyTypeFilter,
    newSession,
    loadSession,
  };
};
