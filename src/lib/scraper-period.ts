export type ScrapedPeriod = {
  start: string;
  end: string;
  startRaw: string;
  endRaw: string;
  fetchedOn: string;
};

type PersistedScraperState = {
  startDate: string;
  endDate: string;
  sessionDate?: string;
  fetchedOn?: string;
};

type HydrateScraperPeriodOptions = {
  stateKey: string;
  periodKey?: string;
};

function getTodayStorageDate() {
  return new Date().toLocaleDateString('en-CA');
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isSameDayPeriod(dateTag?: string) {
  return dateTag === getTodayStorageDate();
}

export function formatScrapedPeriodDate(value?: string) {
  if (!value) return '';

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split('-');
    const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return value;
}

export function getDefaultScraperDateRange() {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

export function buildScrapedPeriod(startDate: Date, endDate: Date): ScrapedPeriod {
  return {
    start: startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    end: endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    startRaw: startDate.toISOString(),
    endRaw: endDate.toISOString(),
    fetchedOn: getTodayStorageDate(),
  };
}

export function hydrateScraperPeriod({ stateKey, periodKey }: HydrateScraperPeriodOptions) {
  const defaults = getDefaultScraperDateRange();
  let startDate = defaults.startDate;
  let endDate = defaults.endDate;
  let scrapedPeriod: ScrapedPeriod | null = null;

  if (periodKey) {
    const savedPeriod = safeParse<ScrapedPeriod>(localStorage.getItem(periodKey));
    if (savedPeriod) {
      // Always hydrate the period for display purposes
      scrapedPeriod = savedPeriod;
      
      // Only use the period's dates if it was fetched today
      if (isSameDayPeriod(savedPeriod.fetchedOn)) {
        if (savedPeriod.startRaw) startDate = new Date(savedPeriod.startRaw);
        if (savedPeriod.endRaw) endDate = new Date(savedPeriod.endRaw);
      }
    }
  }

  const savedState = safeParse<PersistedScraperState>(localStorage.getItem(stateKey));
  const savedDateTag = savedState?.fetchedOn || savedState?.sessionDate;
  if (savedState && isSameDayPeriod(savedDateTag)) {
    if (savedState.startDate) startDate = new Date(savedState.startDate);
    if (savedState.endDate) endDate = new Date(savedState.endDate);
  }

  return { startDate, endDate, scrapedPeriod };
}

export function persistScraperPeriod(
  { stateKey, periodKey }: HydrateScraperPeriodOptions,
  startDate: Date,
  endDate: Date
) {
  const fetchedOn = getTodayStorageDate();
  const state: PersistedScraperState = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sessionDate: fetchedOn,
    fetchedOn,
  };
  localStorage.setItem(stateKey, JSON.stringify(state));

  const period = buildScrapedPeriod(startDate, endDate);
  if (periodKey) {
    localStorage.setItem(periodKey, JSON.stringify(period));
  }

  return period;
}

// ---- Generic composite-date-store for non-scraper pages (Jurnal, Hasil, Tracking) ----

const DATE_STORE_VERSION = 1;

interface DateStore {
  v: number;
  startDate: string;
  endDate: string;
  dateTag: string;
}

export function persistDateStore(key: string, startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate) return;
  const store: DateStore = {
    v: DATE_STORE_VERSION,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dateTag: new Date().toDateString(),
  };
  localStorage.setItem(key, JSON.stringify(store));
}

export function hydrateDateStore(key: string): { startDate: Date | null; endDate: Date | null } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { startDate: null, endDate: null };
    const store: DateStore = JSON.parse(raw);
    if (!store || store.v !== DATE_STORE_VERSION) return { startDate: null, endDate: null };

    const isNewDay = store.dateTag !== new Date().toDateString();
    if (isNewDay) {
      localStorage.removeItem(key);
      return { startDate: null, endDate: null };
    }

    const dStart = new Date(store.startDate);
    const dEnd = new Date(store.endDate);
    if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) {
      localStorage.removeItem(key);
      return { startDate: null, endDate: null };
    }

    return { startDate: dStart, endDate: dEnd };
  } catch {
    localStorage.removeItem(key);
    return { startDate: null, endDate: null };
  }
}
