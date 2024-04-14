import {
  ExtractedConfig,
  FocusRestCycle,
  SessionPeriod,
} from '../types/utils.type';
import { configRegex } from '../constants';
import { KnownUserError } from '../errors';

export const validateConfig = (input: string): ExtractedConfig => {
  const match = input.match(configRegex);
  if (!match) {
    throw new KnownUserError('Invalid config format');
  }

  const [, days, sessionPeriods, focusRestCycles] = match;

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
