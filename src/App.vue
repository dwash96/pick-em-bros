<script setup>
import { computed, ref } from 'vue';
import {
  data,
  seasons,
  currentSeason,
  getCurrentWeek,
  getAllWeeks,
  seasonStats,
} from './lib/data.js';
import WinRateBanner from './components/WinRateBanner.vue';
import WeekView from './components/WeekView.vue';
import WeekPager from './components/WeekPager.vue';
import GameModal from './components/GameModal.vue';

const currentWeek = getCurrentWeek();
const allWeeks = getAllWeeks();
// Past weeks = every week except the current (latest) week, sorted desc.
const pastWeeks = currentWeek
  ? allWeeks.filter((w) => !(w.year === currentWeek.year && w.week === currentWeek.week))
  : allWeeks;

const season = currentSeason;
const stats = computed(() => seasonStats(season));

const pastIndex = ref(0);
const selectedPastWeek = computed(() => pastWeeks[pastIndex.value] || null);

const activeGame = ref(null);
const activeWeekTitle = computed(() => {
  if (!activeGame.value) return '';
  return gameWeekTitle(activeGame.value);
});

function gameWeekTitle(game) {
  return `Week ${game.week} · ${game.year}`;
}

function openGame(game) {
  activeGame.value = game;
}

function closeModal() {
  activeGame.value = null;
}

function goToPast(index) {
  pastIndex.value = index;
}
</script>

<template>
  <header class="site-header">
    <div class="container">
      <a class="brand" href="#">
        <div class="brand-logo">PB</div>
        <div class="brand-text">
          <b>PickEmBros</b>
          <span>NFL Picks · Results · Lessons</span>
        </div>
      </a>
      <a class="chip" href="#past" style="text-decoration: none; color: var(--md-on-surface)">Past weeks ↓</a>
    </div>
  </header>

  <div class="container">
    <!-- Win-rate banner -->
    <WinRateBanner :season="season" :stats="stats" />

    <!-- Current week -->
    <template v-if="currentWeek">
      <div class="section-title">
        <h2>This Week's Picks</h2>
        <span class="sub">Week {{ currentWeek.week }} · {{ currentWeek.year }}</span>
      </div>
      <p v-if="currentWeek.intro" class="week-sub">{{ currentWeek.intro }}</p>
      <WeekView :week="currentWeek" @open="openGame" />
    </template>
    <p v-else class="empty-note">No current week data yet — add a <code>data/&lt;year&gt;/week-&lt;N&gt;.yml</code> file.</p>

    <!-- Past weeks pager -->
    <div id="past" class="section-title">
      <h2>Past Picks</h2>
      <span class="sub">Browse weeks we've already called</span>
    </div>
    <WeekPager
      :weeks="pastWeeks"
      :index="pastIndex"
      @select="goToPast"
    />
    <template v-if="selectedPastWeek">
      <div class="week-sub" style="margin: 4px 0 14px">
        Week {{ selectedPastWeek.week }} · {{ selectedPastWeek.year }}
      </div>
      <WeekView :week="selectedPastWeek" @open="openGame" />
    </template>
    <p v-else class="empty-note">No past weeks yet.</p>
  </div>

  <footer class="site-footer">
    <div class="container">
      PickEmBros Podcast · picks are our own opinions · built with 💜
    </div>
  </footer>

  <GameModal
    v-if="activeGame"
    :game="activeGame"
    :week-label="activeWeekTitle"
    @close="closeModal"
  />
</template>
