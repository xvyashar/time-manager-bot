import { ExtractedConfig, FocusRestCycle, SessionPeriod } from '../types';
import { configRegex } from '../constants';
import { KnownUserError } from '../errors';

export const validateConfig = (input: string): ExtractedConfig => {
  const match = input.match(configRegex);
  if (!match) {
    throw new KnownUserError('Invalid config format');
  }

  const [, timezoneOffset, days, sessionPeriods, focusRestCycles] = match;

  const formattedSessionPeriods: SessionPeriod[] = sessionPeriods
    .split(',')
    .map((period) => {
      const [start, end] = period.split('-');
      return { start, end };
    });

  if (!arePeriodsValid(formattedSessionPeriods))
    throw new KnownUserError('Invalid session periods');

  const formattedCycles: FocusRestCycle[] = focusRestCycles
    .split(',')
    .map((period) => {
      const [focusDuration, restDuration] = period.split('-');
      return { focusDuration, restDuration };
    });

  return {
    timezoneOffset: timeToMinutes(timezoneOffset),
    days: days.split(','),
    sessionPeriods: formattedSessionPeriods,
    focusRestCycles: formattedCycles,
  };
};

const arePeriodsValid = (periods: SessionPeriod[]): boolean => {
  for (let i = 0; i < periods.length - 1; i++) {
    const currentSession = periods[i];
    const nextSession = periods[i + 1];

    if (currentSession.end >= nextSession.start) return false;
  }

  return true;
};

export const timeToMinutes = (time: string): number => {
  let sign = time.substring(0, 1);
  if (sign === '+' || sign === '-') time = time.substring(1);
  else sign = '';
  const [hours, minutes] = time.split(':');

  return +`${sign}${+hours * 60 + +minutes}`;
};

export const extractCycles = (cycles: FocusRestCycle[]): number[] => {
  const extracted: number[] = [];

  for (const cycle of cycles) {
    let sign = cycle.focusDuration.substring(cycle.focusDuration.length - 1);
    if (sign === 'm')
      extracted.push(
        +cycle.focusDuration.substring(0, cycle.focusDuration.length - 1)
      );
    else if (sign === 'h')
      extracted.push(
        +cycle.focusDuration.substring(0, cycle.focusDuration.length - 1) * 60
      );

    sign = cycle.restDuration.substring(cycle.restDuration.length - 1);
    if (sign === 'm')
      extracted.push(
        +cycle.restDuration.substring(0, cycle.restDuration.length - 1)
      );
    else if (sign === 'h')
      extracted.push(
        +cycle.restDuration.substring(0, cycle.restDuration.length - 1) * 60
      );
  }

  return extracted;
};
