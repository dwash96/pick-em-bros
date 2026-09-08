import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * Reads all season/week YAML files from a data directory and exposes them
 * as a single virtual module (`virtual:picks-data`) containing a JS object.
 *
 * Data directory structure:
 *   <dataDir>/{year}/week-{number}.yml
 *
 * The exposed module shape is:
 *   {
 *     seasons: {
 *       "<year>": {
 *         year: "<year>",
 *         label: "<year> Season",
 *         weeks: [ { week, games, ... }, ... ]  // sorted by week number
 *       }, ...
 *     }
 *   }
 */
export function picksDataPlugin(dataDir) {
  const id = 'virtual:picks-data';
  const resolvedId = '\0' + id;

  function collectYears(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d{4}$/.test(e.name))
      .map((e) => e.name)
      .sort();
  }

  function loadWeekFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(raw) || {};
    return doc;
  }

  function loadSeason(year, seasonDir) {
    const files = fs
      .readdirSync(seasonDir, { withFileTypes: true })
      .filter((e) => e.isFile() && /^week-(\d+)\.ya?ml$/.test(e.name))
      .sort((a, b) => {
        const n = (f) => parseInt(f.match(/^week-(\d+)/)[1], 10);
        return n(a.name) - n(b.name);
      });

    const weeks = files.map((file) => {
      const weekMatch = file.name.match(/^week-(\d+)\.ya?ml$/);
      const weekNum = parseInt(weekMatch[1], 10);
      const doc = loadWeekFile(path.join(seasonDir, file.name));
      const week = doc.week ?? weekNum;
      return {
        year,
        week,
        ...doc,
        games: (doc.games || []).map((g) => ({ year, week, ...g })),
      };
    });

    let label = `${year} Season`;
    if (weeks.length && weeks[0].season) label = weeks[0].season;
    return { year, label, weeks };
  }

  return {
    name: 'picks-data',
    resolveId(source) {
      if (source === id) return resolvedId;
      return null;
    },
    load(loadId) {
      if (loadId !== resolvedId) return null;

      const root = path.resolve(process.cwd(), dataDir || 'data');
      const years = collectYears(root);
      const seasons = {};
      for (const year of years) {
        const seasonDir = path.join(root, year);
        if (fs.existsSync(seasonDir)) {
          seasons[year] = loadSeason(year, seasonDir);
        }
      }
      const payload = { seasons };
      return `export default ${JSON.stringify(payload)};\n`;
    },
  };
}
