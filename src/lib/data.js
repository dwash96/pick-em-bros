import rawData from 'virtual:picks-data';

/**
 * Normalized access to the picks data exposed by the Vite plugin.
 * `rawData` shape:
 *   { seasons: { "<year>": { year, label, weeks: [...] } } }
 */
export const data = rawData;

/** All seasons, sorted by year descending (most recent first). */
export const seasons = Object.values(rawData.seasons).sort(
  (a, b) => Number(b.year) - Number(a.year),
);

/** The most recent season. */
export const currentSeason = seasons[0] || null;

/** The most recent week in the most recent season (current week). */
export function getCurrentWeek() {
  if (!currentSeason) return null;
  // Prefer an explicitly-flagged current week (data/{year}/week-{N}.yml with `current: true`).
  const active = currentSeason.weeks.find((w) => w.current === true);
  if (active) return active;
  const weeks = [...currentSeason.weeks].sort((a, b) => Number(b.week) - Number(a.week));
  return weeks[0] || null;
}

/** A flat, sorted list of all weeks across all seasons. */
export function getAllWeeks() {
  const all = [];
  for (const season of seasons) {
    for (const week of season.weeks) all.push(week);
  }
  return all.sort((a, b) => {
    if (a.year !== b.year) return Number(b.year) - Number(a.year);
    return Number(b.week) - Number(a.week);
  });
}

/** Team metadata map keyed by abbreviation. */
export const TEAMS = {
  ARI: { name: 'Arizona Cardinals', city: 'Arizona', nickname: 'Cardinals', logo: 'ari.png', color: '#97233F' },
  ATL: { name: 'Atlanta Falcons', city: 'Atlanta', nickname: 'Falcons', logo: 'atl.png', color: '#A71930' },
  BAL: { name: 'Baltimore Ravens', city: 'Baltimore', nickname: 'Ravens', logo: 'bal.png', color: '#241773' },
  BUF: { name: 'Buffalo Bills', city: 'Buffalo', nickname: 'Bills', logo: 'buf.png', color: '#00338D' },
  CAR: { name: 'Carolina Panthers', city: 'Carolina', nickname: 'Panthers', logo: 'car.png', color: '#0085CA' },
  CHI: { name: 'Chicago Bears', city: 'Chicago', nickname: 'Bears', logo: 'chi.png', color: '#0B162A' },
  CIN: { name: 'Cincinnati Bengals', city: 'Cincinnati', nickname: 'Bengals', logo: 'cin.png', color: '#FB4F14' },
  CLE: { name: 'Cleveland Browns', city: 'Cleveland', nickname: 'Browns', logo: 'cle.png', color: '#311D00' },
  DAL: { name: 'Dallas Cowboys', city: 'Dallas', nickname: 'Cowboys', logo: 'dal.png', color: '#041E42' },
  DEN: { name: 'Denver Broncos', city: 'Denver', nickname: 'Broncos', logo: 'den.png', color: '#FB4F14' },
  DET: { name: 'Detroit Lions', city: 'Detroit', nickname: 'Lions', logo: 'det.png', color: '#0076B6' },
  GB:  { name: 'Green Bay Packers', city: 'Green Bay', nickname: 'Packers', logo: 'gb.png', color: '#203731' },
  HOU: { name: 'Houston Texans', city: 'Houston', nickname: 'Texans', logo: 'hou.png', color: '#03202F' },
  IND: { name: 'Indianapolis Colts', city: 'Indianapolis', nickname: 'Colts', logo: 'ind.png', color: '#002C5F' },
  JAX: { name: 'Jacksonville Jaguars', city: 'Jacksonville', nickname: 'Jaguars', logo: 'jax.png', color: '#006778' },
  KC:  { name: 'Kansas City Chiefs', city: 'Kansas City', nickname: 'Chiefs', logo: 'kc.png', color: '#E31837' },
  LAC: { name: 'Los Angeles Chargers', city: 'Los Angeles', nickname: 'Chargers', logo: 'lac.png', color: '#0080C6' },
  LAR: { name: 'Los Angeles Rams', city: 'Los Angeles', nickname: 'Rams', logo: 'lar.png', color: '#003594' },
  LV:  { name: 'Las Vegas Raiders', city: 'Las Vegas', nickname: 'Raiders', logo: 'lv.png', color: '#000000' },
  MIA: { name: 'Miami Dolphins', city: 'Miami', nickname: 'Dolphins', logo: 'mia.png', color: '#008E97' },
  MIN: { name: 'Minnesota Vikings', city: 'Minnesota', nickname: 'Vikings', logo: 'min.png', color: '#4F2683' },
  NE:  { name: 'New England Patriots', city: 'New England', nickname: 'Patriots', logo: 'ne.png', color: '#002244' },
  NO:  { name: 'New Orleans Saints', city: 'New Orleans', nickname: 'Saints', logo: 'no.png', color: '#D3BC8D' },
  NYG: { name: 'New York Giants', city: 'New York', nickname: 'Giants', logo: 'nyg.png', color: '#0B2265' },
  NYJ: { name: 'New York Jets', city: 'New York', nickname: 'Jets', logo: 'nyj.png', color: '#125740' },
  PHI: { name: 'Philadelphia Eagles', city: 'Philadelphia', nickname: 'Eagles', logo: 'phi.png', color: '#004C54' },
  PIT: { name: 'Pittsburgh Steelers', city: 'Pittsburgh', nickname: 'Steelers', logo: 'pit.png', color: '#FFB612' },
  SF:  { name: 'San Francisco 49ers', city: 'San Francisco', nickname: '49ers', logo: 'sf.png', color: '#AA0000' },
  SEA: { name: 'Seattle Seahawks', city: 'Seattle', nickname: 'Seahawks', logo: 'sea.png', color: '#002244' },
  TB:  { name: 'Tampa Bay Buccaneers', city: 'Tampa Bay', nickname: 'Buccaneers', logo: 'tb.png', color: '#D50A0A' },
  TEN: { name: 'Tennessee Titans', city: 'Tennessee', nickname: 'Titans', logo: 'ten.png', color: '#0C2340' },
  WAS: { name: 'Washington Commanders', city: 'Washington', nickname: 'Commanders', logo: 'was.png', color: '#5A1414' },
};

/** Look up a team by abbreviation, falling back to any team object. */
export function teamInfo(team) {
  if (!team) return null;
  const abbr = (team.abbr || team).toUpperCase();
  return TEAMS[abbr] || { name: team.name || abbr, abbr, nickname: abbr, logo: team.logo || `${abbr.toLowerCase()}.png` };
}

/** Resolve a logo URL for a team. */
export function teamLogo(team) {
  const info = teamInfo(team);
  const file = info?.logo || `${(team?.abbr || team || '').toLowerCase()}.png`;
  return `${import.meta.env.BASE_URL}assets/teams/${file}`;
}

/** Build a display string like "KC" from a team ref. */
export function teamAbbr(team) {
  return (team?.abbr || team || '').toUpperCase();
}

/** Aggregate season stats: correct/wrong/pending counts across all weeks. */
export function seasonStats(season) {
  const stats = { correct: 0, wrong: 0, pending: 0, total: 0 };
  if (!season) return stats;
  const seen = new Set();
  for (const week of season.weeks) {
    for (const game of week.games || []) {
      if (!game.pick) continue; // only count games we've actually made a pick for
      const key = `${game.home?.abbr}-${game.away?.abbr}-${game.pick}`;
      if (seen.has(key)) continue;
      seen.add(key);
      stats.total += 1;
      if (game.result === 'correct') stats.correct += 1;
      else if (game.result === 'wrong') stats.wrong += 1;
      else stats.pending += 1;
    }
  }
  return stats;
}

/** Win-rate percentage string for a stats object. */
export function winRate(stats) {
  const decided = stats.correct + stats.wrong;
  if (!decided) return '—';
  return `${Math.round((stats.correct / decided) * 100)}%`;
}
