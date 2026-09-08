<script setup>
import { computed } from 'vue';
import { teamLogo, teamAbbr } from '../lib/data.js';

const props = defineProps({
  game: { type: Object, required: true },
});

defineEmits(['click']);

const home = computed(() => props.game.home || {});
const away = computed(() => props.game.away || {});
const pick = computed(() => (props.game.pick || '').toUpperCase());
const result = computed(() => props.game.result || 'pending');
const isHomePick = computed(() => home.value.abbr && pick.value === home.value.abbr.toUpperCase());
const isAwayPick = computed(() => away.value.abbr && pick.value === away.value.abbr.toUpperCase());
const pickLabel = computed(() => pick.value || '—');
</script>

<template>
  <article class="card game-card" @click="$emit('click')">
    <div class="game-top">
      <div class="matchup">
        <div class="team" :class="{ picked: isHomePick }">
          <img :src="teamLogo(home)" :alt="home.name || home.abbr" />
          <div>
            <div class="name">{{ home.name || home.abbr }}</div>
            <div class="abbr">{{ home.abbr }}</div>
          </div>
        </div>
        <span class="vs">vs</span>
        <div class="team" :class="{ picked: isAwayPick }">
          <img :src="teamLogo(away)" :alt="away.name || away.abbr" />
          <div>
            <div class="name">{{ away.name || away.abbr }}</div>
            <div class="abbr">{{ away.abbr }}</div>
          </div>
        </div>
      </div>
      <span class="pick-badge" :class="result">{{ pickLabel }}</span>
    </div>
    <div class="game-bottom">
      <div class="rationale-preview">{{ game.rationale || 'Click to view rationale' }}</div>
      <div v-if="game.result === 'wrong'" class="week-sub">We got this one wrong · tap to see what we learned</div>
    </div>
  </article>
</template>
