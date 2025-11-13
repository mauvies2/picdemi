# Talent AI Matching - Phase 2

## Overview

This document outlines the Phase 2 implementation plan for AI-assisted talent photo discovery. This feature will automatically suggest talent matches for photos using AI/ML models, allowing photographers to review and approve matches before they are tagged.

## Goals

- Automatically detect potential talent matches in photos using AI
- Provide photographers with a review interface to approve/deny suggested matches
- Improve discovery for talent users by surfacing photos they might be in
- Reduce manual tagging workload for photographers

## Architecture

### Database Schema

```sql
-- Table to store AI-generated talent match suggestions
create table ai_talent_matches (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  talent_user_id uuid not null references auth.users(id) on delete cascade,
  confidence_score decimal(3,2) not null, -- 0.00 to 1.00
  model_version text not null, -- e.g., "v1.0", "v2.1"
  match_type text not null, -- "face", "outfit", "bib_number", "composite"
  metadata jsonb, -- Additional match metadata (coordinates, features, etc.)
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id),
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  
  unique(photo_id, talent_user_id, model_version)
);

create index ai_talent_matches_photo_id_idx on ai_talent_matches(photo_id);
create index ai_talent_matches_talent_user_id_idx on ai_talent_matches(talent_user_id);
create index ai_talent_matches_status_idx on ai_talent_matches(status);
create index ai_talent_matches_confidence_score_idx on ai_talent_matches(confidence_score desc);
```

### RLS Policies

- Photographers can view matches for their own photos
- Talent can view approved matches where they are the talent
- Only system/service role can insert new matches
- Photographers can update status (approve/reject)

## Input Filters

When running batch inference, the system will accept the following filters:

```typescript
interface BatchInferenceFilters {
  // Event filters
  eventIds?: string[];
  activity?: string[];
  city?: string[];
  country?: string[];
  dateRange?: {
    start: string; // ISO date
    end: string; // ISO date
  };
  
  // Photo filters
  minConfidence?: number; // 0.0 to 1.0
  matchTypes?: ('face' | 'outfit' | 'bib_number' | 'composite')[];
  
  // Talent pool filters
  talentUserIds?: string[]; // Specific talent to match against
  talentActivityPreferences?: string[]; // Match against talent's activity preferences
}
```

## Batch Inference Process

1. **Photo Selection**: Query photos matching the input filters
2. **Talent Pool Selection**: 
   - If `talentUserIds` provided, use those
   - Otherwise, query talent users who have:
     - Activity preferences matching event activities
     - Location preferences matching event locations
     - Opted into AI matching
3. **Model Inference**: 
   - For each photo-talent pair:
     - Extract features (face, outfit, bib numbers, etc.)
     - Compare against talent's reference data
     - Calculate confidence scores
     - Generate match suggestions if score > threshold
4. **Database Write**: Insert candidate matches into `ai_talent_matches` table
5. **Notification**: Optionally notify photographers of new matches to review

## Review UI for Photographers

### Location
`/dashboard/photographer/events/[id]/ai-matches` or integrated into event detail page

### Features
- List of pending matches for the event
- Display:
  - Photo thumbnail
  - Talent name/email
  - Confidence score
  - Match type (face, outfit, etc.)
  - Side-by-side comparison (if available)
- Actions:
  - Approve → Creates `talent_photo_tags` entry
  - Reject → Marks match as rejected
  - Bulk approve/reject
  - Filter by confidence score, match type

### Component Structure
```
EventAIMatchesPage
  ├── MatchFilters (confidence, type, status)
  ├── MatchList
  │   └── MatchCard (photo, talent, score, actions)
  └── BulkActions (approve all, reject all)
```

## API/Server Actions

```typescript
// Get pending matches for an event
async function getPendingAIMatches(
  eventId: string,
  filters?: { minConfidence?: number; matchType?: string }
): Promise<AIMatch[]>

// Approve a match (creates talent_photo_tag)
async function approveAIMatch(matchId: string): Promise<void>

// Reject a match
async function rejectAIMatch(matchId: string): Promise<void>

// Bulk approve/reject
async function bulkReviewAIMatches(
  matchIds: string[],
  action: 'approve' | 'reject'
): Promise<void>

// Trigger batch inference (admin/system only)
async function triggerBatchInference(
  filters: BatchInferenceFilters
): Promise<{ jobId: string; estimatedMatches: number }>
```

## Model Integration Points

### Face Recognition
- Use facial recognition models (e.g., FaceNet, ArcFace)
- Compare against talent's reference photos
- Store face embeddings in talent profiles

### Outfit/Appearance Matching
- Extract color patterns, clothing items
- Compare against talent's known appearances
- Useful for events where faces may not be clearly visible

### Bib/Number Recognition
- OCR to extract bib numbers from photos
- Match against talent's registered bib numbers for events
- High confidence when bib number matches

### Composite Scoring
- Combine multiple signals (face + outfit + bib)
- Weighted confidence score
- Higher threshold for composite matches

## Reference Data for Talent

Talent users can provide reference data to improve matching:

```typescript
interface TalentReferenceData {
  // Face embeddings
  faceEmbeddings: number[][];
  
  // Known appearances
  outfitDescriptions: string[];
  colorPreferences: string[];
  
  // Event registrations
  eventBibNumbers: Array<{
    eventId: string;
    bibNumber: string;
  }>;
  
  // Preferences
  activityTypes: string[];
  locationPreferences: string[];
}
```

## Performance Considerations

- Batch processing should run asynchronously (background jobs)
- Use queue system (e.g., Bull, BullMQ) for inference jobs
- Cache talent reference data
- Limit batch sizes to prevent timeouts
- Use database transactions for bulk inserts
- Consider using vector databases for face embeddings

## Privacy & Consent

- Talent must opt-in to AI matching
- Photographers must consent to AI suggestions
- Clear indication when matches are AI-generated vs. manual
- Ability to disable AI matching per event or globally
- GDPR compliance for face data storage

## Future Enhancements

- Real-time matching during event upload
- Mobile app notifications for new matches
- Talent can provide feedback on matches (correct/incorrect)
- Continuous learning from approved/rejected matches
- Integration with event registration systems for automatic bib matching

## Implementation Checklist

- [ ] Create `ai_talent_matches` table and indexes
- [ ] Implement RLS policies
- [ ] Create database query functions
- [ ] Build batch inference service/worker
- [ ] Create photographer review UI
- [ ] Implement approve/reject server actions
- [ ] Add talent reference data collection UI
- [ ] Set up background job processing
- [ ] Add notifications for new matches
- [ ] Write tests for matching logic
- [ ] Add monitoring and logging

