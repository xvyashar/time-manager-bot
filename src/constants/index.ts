export const configRegex =
  /^([+-]\d{1,2}:\d{2})\s+((?:sat|sun|mon|tue|wed|thu|fri)(?:,(?:sat|sun|mon|tue|wed|thu|fri))*)\s+((?:[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9],?)+)\s+((?:[0-9]+[mh]-[0-9]+[mh],?)+)?$/;
export const schedulerCronPattern = '*/30 * * * * *';
export const minutesBeforeCycleStart = 5;
