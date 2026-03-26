'use client';

import { format } from 'date-fns';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SimilarityMatch } from './actions';

interface AIMatchingResultsProps {
  matches: SimilarityMatch[];
  selectedPhotoIds: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onAddToLibrary: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function AIMatchingResults({
  matches,
  selectedPhotoIds,
  onSelectionChange,
  onAddToLibrary,
  onCancel,
  isPending,
}: AIMatchingResultsProps) {
  const handleToggleSelect = (photoId: string) => {
    const newSelected = new Set(selectedPhotoIds);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    onSelectionChange(newSelected);
  };

  const getConfidenceLabel = (
    score: number,
  ): {
    label: string;
    color: string;
  } => {
    if (score >= 0.8) {
      return { label: 'Likely Match', color: 'text-green-600' };
    }
    if (score >= 0.6) {
      return { label: 'Possible Match', color: 'text-yellow-600' };
    }
    return { label: 'Low Match', color: 'text-orange-600' };
  };

  const selectedCount = selectedPhotoIds.size;

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No matches found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or uploading a different selfie
        </p>
        <Button onClick={onCancel} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            Found {matches.length} potential match
            {matches.length === 1 ? '' : 'es'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Select the photos that are actually you
          </p>
        </div>
        {selectedCount > 0 && <div className="text-sm font-medium">{selectedCount} selected</div>}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
        {matches.map((match) => {
          const confidence = getConfidenceLabel(match.similarity_score);
          const isSelected = selectedPhotoIds.has(match.photo_id);

          return (
            <button
              type="button"
              key={match.photo_id}
              className={cn(
                'relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all w-full',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50',
              )}
              onClick={() => handleToggleSelect(match.photo_id)}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} photo from ${match.event_name ?? 'event'}`}
            >
              {/* Photo */}
              {match.photo_url ? (
                <div className="aspect-square relative bg-muted">
                  <Image
                    src={match.photo_url}
                    alt={`Photo from ${match.event_name ?? 'event'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={
                      match.photo_url.startsWith('http://localhost') ||
                      match.photo_url.startsWith('http://127.0.0.1')
                    }
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay with confidence and selection */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-1 rounded',
                        confidence.color,
                        'bg-background/90',
                      )}
                    >
                      {confidence.label}
                    </span>
                    <div
                      className={cn(
                        'rounded-full p-1 bg-background/90',
                        isSelected && 'bg-primary',
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-foreground/50" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection indicator (always visible when selected) */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="rounded-full p-1 bg-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Confidence badge (always visible) */}
              <div className="absolute top-2 left-2">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    confidence.color,
                    'bg-background/90',
                  )}
                >
                  {Math.round(match.similarity_score * 100)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Event info for selected photos */}
      {selectedCount > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-2">
            Selected photos from {selectedCount} event
            {selectedCount === 1 ? '' : 's'}
          </p>
          <div className="space-y-1">
            {Array.from(selectedPhotoIds)
              .map((photoId) => matches.find((m) => m.photo_id === photoId))
              .filter((match): match is SimilarityMatch => match !== undefined)
              .map((match, idx) => (
                <div key={match.photo_id} className="text-xs text-muted-foreground">
                  {idx + 1}. {match.event_name ?? 'Unknown event'}
                  {match.event_date && <> • {format(new Date(match.event_date), 'MMM d, yyyy')}</>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={onAddToLibrary} disabled={selectedCount === 0 || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            `Add ${selectedCount} Photo${selectedCount === 1 ? '' : 's'} to My Library`
          )}
        </Button>
      </div>
    </div>
  );
}
