export interface SessionPeriod {
  start: string;
  end: string;
}

export interface FocusRestCycle {
  focusDuration: string;
  restDuration: string;
}

export interface ExtractedConfig {
  days: string[];
  sessionPeriods: SessionPeriod[];
  focusRestCycles: FocusRestCycle[];
}
