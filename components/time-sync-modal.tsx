'use client';

import { AlertCircle, CheckCircle2, Loader2, QrCode, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  completeSyncAction,
  createTimeSyncTokenAction,
} from '@/app/[lang]/dashboard/photographer/events/[id]/time-sync-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const T = {
  en: {
    title: 'Camera Time Sync',
    description:
      'Synchronize your camera clock with server time so attendees can filter photos by time.',
    generatingQr: 'Generating QR code\u2026',
    qrInstruction:
      'Take a photo of this QR with your event camera and we\u2019ll automatically adjust the time of all your photos.',
    thenUploadHere: 'Then upload that photo here:',
    uploadSyncPhoto: 'Upload sync photo',
    scanning: 'Scanning photo and calculating offset\u2026',
    synced: 'Synced!',
    offsetMessage: (n: number) =>
      `Your camera has an offset of ${n} second${n !== 1 ? 's' : ''}. Focus on the shot \u2014 we\u2019ll handle the rest.`,
    done: 'Done',
    generateNewQr: 'Generate new QR code',
  },
  es: {
    title: 'Sincronización de hora de cámara',
    description:
      'Sincroniza el reloj de tu cámara con el tiempo del servidor para que los talentos puedan filtrar fotos por hora.',
    generatingQr: 'Generando código QR\u2026',
    qrInstruction:
      'Haz una foto a este QR con la cámara del evento. Ajustaremos la hora de todas tus fotos automáticamente.',
    thenUploadHere: 'Luego sube esa foto aquí:',
    uploadSyncPhoto: 'Subir foto de sincronización',
    scanning: 'Escaneando foto y calculando diferencia\u2026',
    synced: '¡Sincronizado!',
    offsetMessage: (n: number) =>
      `Tu cámara tiene una diferencia de ${n} segundo${n !== 1 ? 's' : ''}. Concéntrate en la foto \u2014 nosotros nos encargamos del resto.`,
    done: 'Listo',
    generateNewQr: 'Generar nuevo código QR',
  },
} as const;

type SyncState =
  | { status: 'loading' }
  | { status: 'ready'; tokenId: string }
  | { status: 'uploading' }
  | { status: 'success'; offsetMs: number }
  | { status: 'error'; message: string };

interface TimeSyncModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSynced?: (offsetMs: number) => void;
}

export function TimeSyncModal({ eventId, open, onOpenChange, onSynced }: TimeSyncModalProps) {
  const { lang } = useParams<{ lang?: string }>();
  const t = T[lang === 'en' ? 'en' : 'es'];

  const [state, setState] = useState<SyncState>({ status: 'loading' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadToken = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const token = await createTimeSyncTokenAction(eventId);
      setState({ status: 'ready', tokenId: token.id });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate QR code',
      });
    }
  }, [eventId]);

  useEffect(() => {
    if (open) {
      void loadToken();
    }
  }, [open, loadToken]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || state.status !== 'ready') return;

    setState({ status: 'uploading' });

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('fileLastModified', String(file.lastModified));

    try {
      const result = await completeSyncAction(eventId, formData);

      if (result.success) {
        setState({ status: 'success', offsetMs: result.offsetMs });
        onSynced?.(result.offsetMs);
      } else {
        setState({ status: 'error', message: result.error });
      }
    } catch {
      setState({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const offsetSeconds =
    state.status === 'success' ? Math.round(Math.abs(state.offsetMs) / 1000) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Loading */}
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.generatingQr}</p>
            </div>
          )}

          {/* Ready — show QR */}
          {state.status === 'ready' && (
            <div className="space-y-6">
              <div className="flex justify-center rounded-xl border bg-white p-4">
                <QRCode value={state.tokenId} size={200} />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {t.qrInstruction}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t.thenUploadHere}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/heic,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t.uploadSyncPhoto}
                </Button>
              </div>
            </div>
          )}

          {/* Uploading */}
          {state.status === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.scanning}</p>
            </div>
          )}

          {/* Success */}
          {state.status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="space-y-1">
                <p className="font-semibold">{t.synced}</p>
                <p className="text-sm text-muted-foreground">{t.offsetMessage(offsetSeconds)}</p>
              </div>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {t.done}
              </Button>
            </div>
          )}

          {/* Error */}
          {state.status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{state.message}</p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={loadToken}>
                {t.generateNewQr}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
