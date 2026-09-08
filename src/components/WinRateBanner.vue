<script setup>
import { computed } from 'vue';
import { winRate } from '../lib/data.js';

const props = defineProps({
  season: { type: Object, default: null },
  stats: { type: Object, default: () => ({ correct: 0, wrong: 0, pending: 0, total: 0 }) },
});

const rate = computed(() => winRate(props.stats));
const label = computed(() => props.season?.label || 'Season');
</script>

<template>
  <div class="winrate-banner">
    <div>
      <div class="season-label">{{ label }}</div>
      <div class="big">{{ rate }}</div>
      <div class="season-label">win rate (decided picks)</div>
    </div>
    <div class="stat-row">
      <div class="stat">
        <div class="num">{{ stats.total }}</div>
        <div class="lbl">Total picks</div>
      </div>
      <div class="stat">
        <div class="num" style="color:#c9f0c9">{{ stats.correct }}</div>
        <div class="lbl">Correct</div>
      </div>
      <div class="stat">
        <div class="num" style="color:#ffd9d9">{{ stats.wrong }}</div>
        <div class="lbl">Wrong</div>
      </div>
      <div class="stat">
        <div class="num" style="color:#e6e9ff">{{ stats.pending }}</div>
        <div class="lbl">Pending</div>
      </div>
    </div>
  </div>
</template>
