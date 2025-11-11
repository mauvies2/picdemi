"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/database/client";
import {
  completeUploadBatch,
  createEventFromBatch,
  createUploadUrls,
  getBatchStatus,
} from "./actions";

type Target = { name: string; type: string; size: number; path: string };

type Status = {
  status: string;
  extractedCount: number;
  total: number;
  stats: { withGps: number; withoutGps: number; withDate: number };
  suggested: {
    date: string | null;
    timeStart: string | null;
    timeEnd: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
  };
};

export default function NewEventWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [form, setForm] = useState<{
    name: string;
    date: string;
    timeStart?: string;
    timeEnd?: string;
    city?: string;
    province?: string;
    countryCode?: string;
    activity: string;
  }>({
    name: "",
    date: "",
    activity: "OTHER",
  });
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Step 1: Upload
  const onPickFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    setFiles(arr);
    const { batchId, targets } = await createUploadUrls({
      files: arr.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    });
    setBatchId(batchId);
    setTargets(targets);
  };

  const onUpload = async () => {
    if (!batchId || targets.length === 0 || files.length === 0) return;
    setProgress({ done: 0, total: files.length });
    let done = 0;
    // Upload sequentially to simplify progress
    try {
      for (const t of targets) {
        const f = files.find((ff) => ff.name === t.name && ff.size === t.size);
        if (!f) continue;
        const { error } = await supabase.storage
          .from("photos")
          .upload(t.path, f, {
            contentType: f.type,
            upsert: false,
          });
        if (error) throw error;
        done += 1;
        setProgress({ done, total: files.length });
      }
      await completeUploadBatch({
        batchId,
        objects: targets.map((t) => ({
          path: t.path,
          size: t.size,
          contentType: t.type,
        })),
      });
      setStep(2);
    } catch (e: unknown) {
      alert(
        `Upload failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    }
  };

  // Step 2: Poll extraction status
  useEffect(() => {
    if (step !== 2 || !batchId) return;
    let mounted = true;
    const tick = async () => {
      const s = await getBatchStatus({ batchId });
      if (!mounted) return;
      setStatus(s);
      if (s.status === "DONE") {
        // Prefill form
        setForm((prev) => ({
          ...prev,
          date: s.suggested.date ?? prev.date,
          timeStart: s.suggested.timeStart ?? prev.timeStart,
          timeEnd: s.suggested.timeEnd ?? prev.timeEnd,
          city: s.suggested.city ?? prev.city,
          province: s.suggested.province ?? prev.province,
          countryCode: s.suggested.country ?? prev.countryCode,
          name:
            prev.name ||
            `Event ${s.suggested.city ?? ""} ${s.suggested.date ?? ""}`.trim(),
        }));
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [step, batchId]);

  const onCreateEvent = async () => {
    if (!batchId) return;
    const payload = {
      batchId,
      name: form.name || "Event",
      date: form.date || new Date().toISOString().slice(0, 10),
      timeStart: form.timeStart || null,
      timeEnd: form.timeEnd || null,
      city: form.city || null,
      province: form.province || null,
      countryCode: form.countryCode || null,
      activity: form.activity,
    };
    try {
      const { eventId } = await createEventFromBatch(payload);
      router.push(`/dashboard/events/${eventId}`);
    } catch (e: unknown) {
      alert(
        `Create event failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="p-4">
      <DashboardHeader title="Create Event" />
      {step === 1 && (
        <div className="mt-6 gap-4 rounded-xl border p-6">
          <Label htmlFor="files" className="mb-2">
            Upload photos
          </Label>
          <Input
            id="files"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.heic"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              {files.length} files selected
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              onClick={onUpload}
              disabled={!batchId || files.length === 0}
            >
              Upload
            </Button>
            <div className="text-sm text-muted-foreground">
              {progress.done > 0 &&
                `${progress.done}/${progress.total} uploaded`}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Review extracted data</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Event name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Event name"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Time start</Label>
                <Input
                  type="datetime-local"
                  value={form.timeStart ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, timeStart: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Time end</Label>
                <Input
                  type="datetime-local"
                  value={form.timeEnd ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, timeEnd: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={form.city ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Province/State</Label>
                <Input
                  value={form.province ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, province: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Country code</Label>
                <Input
                  value={form.countryCode ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, countryCode: e.target.value }))
                  }
                  placeholder="US, CA, MX..."
                />
              </div>
              <div>
                <Label>Activity</Label>
                <select
                  className="h-10 w-full rounded-md border px-3"
                  value={form.activity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, activity: e.target.value }))
                  }
                >
                  {[
                    "SURF",
                    "MTB",
                    "SKATEBOARDING",
                    "RUNNING_ROAD",
                    "RUNNING_TRAIL",
                    "CYCLING_ROAD",
                    "CYCLING_GRAVEL",
                    "BMX",
                    "TRIATHLON",
                    "OPEN_WATER_SWIMMING",
                    "SKI_ALPINE",
                    "SNOWBOARD",
                    "SKI_CROSS_COUNTRY",
                    "CLIMBING_BOULDER",
                    "HIKING",
                    "OTHER",
                  ].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Batch</div>
            <div className="mt-1 text-sm">
              Status: {status?.status ?? "..."}
            </div>
            <div className="mt-1 text-sm">
              Extracted: {status?.extractedCount ?? 0} / {status?.total ?? 0}
            </div>
            <div className="mt-4">
              <Button
                onClick={() => setStep(3)}
                disabled={status?.status !== "DONE"}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Confirm and create</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {form.name}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span> {form.date}
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>{" "}
                {form.timeStart ?? ""} — {form.timeEnd ?? ""}
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {[form.city, form.province, form.countryCode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              <div>
                <span className="text-muted-foreground">Activity:</span>{" "}
                {form.activity}
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={onCreateEvent}>Create event</Button>
            </div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Photos</div>
            <div className="mt-1 text-sm">{status?.total ?? 0} uploaded</div>
          </div>
        </div>
      )}
    </div>
  );
}
