'use client';

import type { ReactFormExtendedApi } from '@tanstack/react-form';
import { Country, State } from 'country-state-city';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import { useId } from 'react';
import {
  activityOptions,
  activityValues,
} from '@/app/[lang]/dashboard/photographer/events/new/activity-options';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FormValues } from '../edit-event-schema';

// biome-ignore format: keep on one line so the single lint suppression below covers all type params
// biome-ignore lint/suspicious/noExplicitAny: TanStack Form has invariant variance on all 12 generic params; using `any` avoids re-deriving exact param types from the call site
type FormInstance = ReactFormExtendedApi<FormValues, any, any, any, any, any, any, any, any, any, any, any>;

type EventFormFieldsProps = {
  form: FormInstance;
  submitAttempted: boolean;
  datePopoverOpen: boolean;
  setDatePopoverOpen: (open: boolean) => void;
};

export function EventFormFields({
  form,
  submitAttempted,
  datePopoverOpen,
  setDatePopoverOpen,
}: EventFormFieldsProps) {
  const dateInputId = useId();

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* Row 1: Name + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (value.trim().length === 0 ? 'Name is required.' : undefined),
          }}
        >
          {(field) => {
            const showFeedback = submitAttempted || field.state.meta.isTouched;
            const error = showFeedback ? field.state.meta.errors?.[0] : null;
            const isInvalid = showFeedback && !field.state.meta.isValid;
            return (
              <div>
                <Label htmlFor="name">Name or place</Label>
                <Input
                  id="name"
                  className="mt-2"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Event name or place"
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  suppressHydrationWarning
                />
                {isInvalid && error ? (
                  <p className="mt-1 text-xs text-destructive">{error}</p>
                ) : null}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="activity"
          validators={{
            onChange: ({ value }) =>
              value && activityValues.includes(value as (typeof activityValues)[number])
                ? undefined
                : 'Activity is required.',
          }}
        >
          {(field) => {
            const showFeedback = submitAttempted || field.state.meta.isTouched;
            const error = showFeedback ? field.state.meta.errors?.[0] : null;
            const isInvalid = showFeedback && !field.state.meta.isValid;
            return (
              <div className="grid gap-2">
                <Label htmlFor="activity">Activity</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as FormValues['activity']);
                    field.handleBlur();
                  }}
                >
                  <SelectTrigger
                    id="activity"
                    className="w-full rounded-md"
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Select an activity" />
                  </SelectTrigger>
                  <SelectContent className="w-[--radix-select-trigger-width]">
                    {activityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
            );
          }}
        </form.Field>
      </div>

      {/* Row 2: Location (Country, State, City) */}
      <form.Field
        name="country"
        validators={{
          onChange: ({ value }) => (value.trim().length === 0 ? 'Country is required.' : undefined),
        }}
      >
        {(countryField) => (
          <form.Field
            name="state"
            validators={{
              onChange: ({ value }) =>
                value.trim().length === 0 ? 'State/Province is required.' : undefined,
            }}
          >
            {(stateField) => (
              <form.Field
                name="city"
                validators={{
                  onChange: () => undefined,
                }}
              >
                {(cityField) => {
                  const showFeedback =
                    submitAttempted ||
                    countryField.state.meta.isTouched ||
                    stateField.state.meta.isTouched ||
                    cityField.state.meta.isTouched;
                  const countryError = showFeedback ? countryField.state.meta.errors?.[0] : null;
                  const stateError = showFeedback ? stateField.state.meta.errors?.[0] : null;
                  const states = State.getStatesOfCountry(countryField.state.value);
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={countryField.state.value}
                            onValueChange={(value: string) => {
                              countryField.handleChange(value);
                              countryField.handleBlur();
                            }}
                          >
                            <SelectTrigger
                              id="country"
                              aria-invalid={showFeedback && !!countryError}
                              className={cn(
                                'w-full',
                                showFeedback && countryError && 'border-destructive',
                              )}
                            >
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {Country.getAllCountries()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((c) => (
                                  <SelectItem key={c.isoCode} value={c.isoCode}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {showFeedback && countryError ? (
                            <p className="text-xs text-destructive">{countryError}</p>
                          ) : null}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="state">State / Province</Label>
                          {states.length > 0 ? (
                            <Select
                              value={stateField.state.value}
                              onValueChange={(value: string) => {
                                stateField.handleChange(value);
                                stateField.handleBlur();
                              }}
                            >
                              <SelectTrigger
                                id="state"
                                aria-invalid={showFeedback && !!stateError}
                                className={cn(
                                  'w-full',
                                  showFeedback && stateError && 'border-destructive',
                                )}
                              >
                                <SelectValue placeholder="Select a state or province" />
                              </SelectTrigger>
                              <SelectContent>
                                {states
                                  .sort((a, b) => a.name.localeCompare(b.name))
                                  .map((s) => (
                                    <SelectItem key={s.isoCode} value={s.isoCode}>
                                      {s.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="state"
                              value={stateField.state.value}
                              onChange={(e) => {
                                stateField.handleChange(e.target.value);
                                stateField.handleBlur();
                              }}
                              placeholder="Enter state or province name"
                              aria-invalid={showFeedback && !!stateError}
                              className={cn(showFeedback && stateError && 'border-destructive')}
                              autoComplete="address-level1"
                              suppressHydrationWarning
                            />
                          )}
                          {showFeedback && stateError ? (
                            <p className="text-xs text-destructive">{stateError}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="city">City (Optional)</Label>
                        <Input
                          id="city"
                          value={cityField.state.value || ''}
                          onChange={(e) => {
                            cityField.handleChange(e.target.value);
                            cityField.handleBlur();
                          }}
                          placeholder="Enter city name"
                          autoComplete="address-level2"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  );
                }}
              </form.Field>
            )}
          </form.Field>
        )}
      </form.Field>

      {/* Row 3: Date + Price per Photo */}
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field
          name="date"
          validators={{
            onChange: ({ value }) => (value && value.length > 0 ? undefined : 'Date is required.'),
          }}
        >
          {(field) => {
            const showFeedback = submitAttempted || field.state.meta.isTouched;
            const error = showFeedback ? field.state.meta.errors?.[0] : null;
            const isInvalid = showFeedback && !field.state.meta.isValid;
            const parsedDate = field.state.value ? new Date(field.state.value) : undefined;
            return (
              <div className="grid gap-2">
                <Label htmlFor={dateInputId}>Date</Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-between rounded-md border border-input text-left font-normal',
                        !parsedDate && 'text-muted-foreground',
                      )}
                      aria-invalid={isInvalid}
                    >
                      {parsedDate ? format(parsedDate, 'PPP') : 'Select date'}
                      <ChevronDownIcon className="size-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parsedDate}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        field.handleChange(date ? format(date, 'yyyy-MM-dd') : '');
                        field.handleBlur();
                        setDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <input
                  id={dateInputId}
                  type="hidden"
                  value={field.state.value}
                  readOnly
                  suppressHydrationWarning
                />
                {isInvalid && error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="price_per_photo"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null) {
                return undefined;
              }
              const num = typeof value === 'string' ? Number.parseFloat(value) : value;
              if (Number.isNaN(num)) {
                return 'Price must be a valid number.';
              }
              if (num < 0) {
                return 'Price cannot be negative.';
              }
              return undefined;
            },
          }}
        >
          {(field) => {
            const showFeedback = submitAttempted || field.state.meta.isTouched;
            const error = showFeedback ? field.state.meta.errors?.[0] : null;
            const isInvalid = showFeedback && !field.state.meta.isValid;
            return (
              <div className="grid gap-2">
                <Label htmlFor="price_per_photo">Price per Photo (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price_per_photo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      field.state.value === null || field.state.value === undefined
                        ? ''
                        : typeof field.state.value === 'string'
                          ? field.state.value
                          : field.state.value.toString()
                    }
                    onChange={(event) => {
                      const val = event.target.value;
                      if (val === '') {
                        field.handleChange(null);
                      } else {
                        const num = Number.parseFloat(val);
                        if (!Number.isNaN(num)) {
                          field.handleChange(num);
                        } else {
                          field.handleChange(val as unknown as number);
                        }
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder="0.00"
                    aria-invalid={isInvalid}
                    className="pl-7"
                    suppressHydrationWarning
                  />
                </div>
                {isInvalid && error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
            );
          }}
        </form.Field>
      </div>

      {/* Visibility Toggle */}
      <form.Field name="is_public">
        {(field) => (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-input p-3">
            <div className="grid gap-1">
              <Label htmlFor="is_public">Event Visibility</Label>
              <p className="text-xs text-muted-foreground">
                {field.state.value
                  ? 'Anyone can access this event'
                  : 'Only people with the share code can access'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {field.state.value ? 'Public' : 'Private'}
              </span>
              <Switch
                id="is_public"
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(checked);
                  field.handleBlur();
                  form.setFieldValue('watermark_enabled', !!checked);
                }}
              />
            </div>
          </div>
        )}
      </form.Field>

      {/* Watermark Toggle */}
      <form.Field name="watermark_enabled">
        {(field) => (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-input p-3">
            <div className="grid gap-1">
              <Label htmlFor="watermark_enabled">Watermark on Photos</Label>
              <p className="text-xs text-muted-foreground">
                Add watermark for talent users (photographers see originals)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {field.state.value ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                id="watermark_enabled"
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(checked);
                  field.handleBlur();
                }}
              />
            </div>
          </div>
        )}
      </form.Field>
    </div>
  );
}
