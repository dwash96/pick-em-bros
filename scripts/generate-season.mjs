#!/usr/bin/env node
/**
 * Generate data/{season}/week-{N}.yml files for an NFL season from ESPN's public
 * scoreboard API. Each game contains only the match-up (home + away teams) so
 * you can fill in pick / rationale / result later.
 *
 * Usage:
 *   node scripts/generate-season.mjs [season] [activeWeek]
 *
 * Example:
 *   node scripts/generate-season.mjs 2026 1
 *   node scripts/generate-season.mjs 2026 8
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const season = Number(process.argv[2] || 2026);
const activeWeek = Number(process.argv[3] || 1); // mark this week as `current: true`
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; PickEmBros-schedule/1.0)',
  Accept: 'application/json',
};

// Normalize ESPN abbreviations to the canonical set used across the site.
const ABBR_OVERRIDES = { WSH: 'WAS', JAC: 'JAX', JAX: 'JAX', LAR: 'LAR' };

async function fetchWeekGames(week) {
  const url = `${BASE}?seasontype=2&week=${week}&season=${season}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`week ${week}: HTTP ${res.status}`);
  const data = await res.json();
  const events = data.events || [];
  return events.map((e) => {
    const comps = e.competitions?.[0]?.competitors || [];
    const home = comps.find((c) => c.homeAway === 'home');
    const away = comps.find((c) => c.homeAway === 'away');
    if (!home || !away) return null;
    const team = (c) => {
      const raw = (c.team?.abbreviation || '').toUpperCase();
      const abbr = ABBR_OVERRIDES[raw] || raw;
      return {
        name: c.team?.displayName || c.team?.name || abbr,
        abbr,
        logo: `${abbr.toLowerCase()}.png`,
      };
    };
    return { home: team(home), away: team(away) };
  }).filter(Boolean);
}

async function main() {
  const outDir = path.resolve('data', String(season));
  fs.mkdirSync(outDir, { recursive: true });

  const allAbbr = new Set();
  for (let week = 1; week <= 18; week++) {
    const games = await fetchWeekGames(week);
    if (!games.length) {
      console.warn(`week ${week}: no games returned`);
    }
    for (const g of games) {
      allAbbr.add(g.home.abbr);
      allAbbr.add(g.away.abbr);
    }
    const doc = {
      year: season,
      week,
      season: `${season} Season`,
      title: `Week ${week}`,
      ...(week === activeWeek ? { current: true } : {}),
      games,
    };
    const content = yaml.dump(doc, { sortKeys: true, noRefs: true });
    const file = path.join(outDir, `week-${week}.yml`);
    fs.writeFileSync(file, content);
    console.log(`wrote ${file} (${games.length} games)`);
  }
  console.log(`\nAll abbreviations found (${allAbbr.size}):`);
  console.log([...allAbbr].sort().join(' '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
