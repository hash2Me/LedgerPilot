"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActionItem {
  task: string;
  assignee: "ACCOUNTANT" | "CLIENT";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
}

interface StructuredSummary {
  summary: string;
  topics: string[];
  actionItems: ActionItem[];
  taxNotes: string[];
  suggestedBillableMinutes: number;
}

interface VoiceNoteRecord {
  id: string;
  clientId: string;
  audioUrl: string;
  transcription: string | null;
  structuredSummary: StructuredSummary | null;
  billableHours: number | string | null;
  createdAt: string;
  client?: {
    id: string;
    companyName: string;
    taxEntity: string;
  };
  user?: {
    id: string;
    fullName: string;
  };
}

interface ClientOption {
  id: string;
  companyName: string;
  taxEntity: string;
}

export default function VoiceNotesPage() {
  // State for historical voice notes & clients
  const [notes, setNotes] = useState<VoiceNoteRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Recorder states
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrlPreview, setAudioUrlPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Refs for audio media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch voice notes and clients list
  const fetchNotesAndClients = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      const [notesRes, clientsRes] = await Promise.all([
        fetch("/api/voice-notes"),
        fetch("/api/clients"),
      ]);

      if (notesRes.ok) {
        const notesJson = await notesRes.json();
        setNotes(notesJson.data || []);
      }

      if (clientsRes.ok) {
        const clientsJson = await clientsRes.json();
        const clientList: ClientOption[] = clientsJson.data || [];
        setClients(clientList);
        if (clientList.length > 0 && !selectedClientId) {
          setSelectedClientId(clientList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load voice notes:", err);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchNotesAndClients();
  }, [fetchNotesAndClients]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start Audio Recording via Web Audio MediaRecorder
  const startRecording = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAudioBlob(null);
    setAudioUrlPreview(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(recordedBlob);
        setAudioUrlPreview(URL.createObjectURL(recordedBlob));
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Slice every 250ms
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMsg("Could not access microphone. Please ensure microphone permissions are granted.");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Cancel / Discard
  const discardRecording = () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setElapsed(0);
    setAudioBlob(null);
    setAudioUrlPreview(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Submit audio to Groq Whisper & LLM extraction API
  const handleTranscribeAndSave = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "consultation_memo.webm");
      if (selectedClientId) {
        formData.append("clientId", selectedClientId);
      }
      formData.append("durationSeconds", String(elapsed));

      const res = await fetch("/api/voice-notes/transcribe", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to process audio consultation");
      }

      setSuccessMsg("Consultation transcribed, action items extracted, and billable time recorded!");
      setAudioBlob(null);
      setAudioUrlPreview(null);
      setElapsed(0);

      // Prepend newly created voice note
      const newNote: VoiceNoteRecord = json.data.voiceNote;
      setNotes((prev) => [newNote, ...prev]);
      setExpandedId(newNote.id);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during transcription.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Voice Note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voice memo?")) return;
    try {
      const res = await fetch(`/api/voice-notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voice-to-Ledger Memos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record client consultations. Auto-generate audit notes, tax action items, and billable hours via Groq Whisper STT.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Consultation Client:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={recording}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.taxEntity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Audio Recording Studio */}
      <Card title="Live Audio Ingestion Studio" description="Record phone calls or client meetings for instantaneous AI ledger structuring">
        <div className="flex flex-col items-center justify-center py-6">
          {/* Animated Waveform Bars */}
          <div className="mb-5 flex items-end justify-center gap-1.5 h-12 w-64">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  recording ? "bg-rose-500 animate-pulse" : "bg-slate-200"
                }`}
                style={{
                  height: recording ? `${Math.max(8, Math.sin((i + elapsed * 2) * 0.5) * 24 + 18)}px` : "6px",
                  animationDelay: `${i * 45}ms`,
                }}
              />
            ))}
          </div>

          {/* Timer Display */}
          <div className="mb-4 font-mono text-3xl font-bold tracking-wider text-slate-800">
            {mm}:{ss}
          </div>

          {/* Recorder Controls */}
          {!recording && !audioBlob && (
            <button
              onClick={startRecording}
              className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <div className="h-6 w-6 rounded-full bg-white transition-transform group-hover:scale-90" />
            </button>
          )}

          {recording && (
            <div className="flex items-center gap-4">
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-rose-700 transition-colors"
              >
                <div className="h-3 w-3 rounded-sm bg-white" />
                Stop &amp; Review
              </button>
              <button
                onClick={discardRecording}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
            </div>
          )}

          {/* Post-Recording Preview & Submit */}
          {!recording && audioBlob && (
            <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Recorded Consultation ({mm}:{ss})</span>
                <span className="text-emerald-600 font-bold">Ready to process</span>
              </div>

              {audioUrlPreview && (
                <audio controls src={audioUrlPreview} className="w-full h-10" />
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleTranscribeAndSave}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Transcribing via Groq Whisper...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Transcribe &amp; Extract Action Items</span>
                    </>
                  )}
                </button>
                <button
                  onClick={discardRecording}
                  disabled={isProcessing}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            {recording
              ? "Recording in progress... Click Stop when finished speaking."
              : !audioBlob
              ? "Click the red microphone to start recording your client consultation memo."
              : "Preview audio and click Transcribe to generate structured audit notes."}
          </p>
        </div>
      </Card>

      {/* Historical Voice Notes & Action Items Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Audit Memos &amp; Client Action Items ({notes.length})
          </h2>
          <span className="text-xs text-slate-500">
            Total Logged Consultations: {notes.length}
          </span>
        </div>

        {isLoadingNotes ? (
          <div className="py-12 text-center text-slate-400">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-xs">Loading consultation memos...</p>
          </div>
        ) : notes.length === 0 ? (
          <Card>
            <div className="py-10 text-center text-slate-400 text-sm">
              No voice memos recorded yet. Record your first consultation above!
            </div>
          </Card>
        ) : (
          notes.map((note) => {
            const isExpanded = expandedId === note.id;
            const summary = note.structuredSummary;
            const dateStr = new Date(note.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const billableHours = Number(note.billableHours || 0);

            return (
              <div
                key={note.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300"
              >
                {/* Note Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {note.client?.companyName || "Client Consultation"}
                      </h3>
                      <span className="text-xs text-slate-400">{dateStr} • Logged by {note.user?.fullName || "Staff"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      ⏱️ {billableHours.toFixed(2)} Billable Hours
                    </Badge>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : note.id)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? "Collapse" : "View Action Items"}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-400 hover:text-rose-600 px-1 text-sm"
                      title="Delete Memo"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {/* Note Body */}
                <div className="p-5 space-y-4">
                  {/* Executive Summary */}
                  {summary?.summary && (
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-slate-800">
                      <span className="font-bold text-blue-900 block mb-1 uppercase tracking-wider text-[10px]">
                        AI Executive Summary
                      </span>
                      {summary.summary}
                    </div>
                  )}

                  {/* Audio Player */}
                  {note.audioUrl && (
                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <audio controls src={note.audioUrl} className="w-full h-8" />
                    </div>
                  )}

                  {/* Discussion Topics */}
                  {summary?.topics && summary.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-semibold text-slate-500 mr-1">Topics:</span>
                      {summary.topics.map((t, idx) => (
                        <span key={idx} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Section: Action Items & Tax Notes */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      {/* Action Items List */}
                      {summary?.actionItems && summary.actionItems.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Extracted Action Items
                          </h4>
                          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                            {summary.actionItems.map((item, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-2 hover:bg-slate-50/60">
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5 text-blue-600">•</span>
                                  <span className="text-xs font-medium text-slate-800">{item.task}</span>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <Badge variant={item.assignee === "ACCOUNTANT" ? "info" : "warning"}>
                                    {item.assignee}
                                  </Badge>
                                  <Badge
                                    variant={
                                      item.priority === "HIGH"
                                        ? "danger"
                                        : item.priority === "MEDIUM"
                                        ? "warning"
                                        : "default"
                                    }
                                  >
                                    {item.priority}
                                  </Badge>
                                  {item.dueDate && (
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      Due {item.dueDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tax / Compliance Notes */}
                      {summary?.taxNotes && summary.taxNotes.length > 0 && (
                        <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 text-xs text-amber-900">
                          <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                            Tax &amp; Regulatory Considerations
                          </span>
                          <ul className="list-disc pl-4 space-y-1">
                            {summary.taxNotes.map((noteText, idx) => (
                              <li key={idx}>{noteText}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Raw Transcript Accordion */}
                      {note.transcription && (
                        <details className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200 cursor-pointer">
                          <summary className="font-semibold text-slate-700">Verbatim Consultation Transcript</summary>
                          <p className="mt-2 text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {note.transcription}
                          </p>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
