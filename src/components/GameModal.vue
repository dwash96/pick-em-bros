<script setup>
import { computed } from 'vue';
import { teamLogo, teamInfo } from '../lib/data.js';

const props = defineProps({
  game: { type: Object, required: true },
  weekLabel: { type: String, default: '' },
});

defineEmits(['close']);

const home = computed(() => props.game.home || {});
const away = computed(() => props.game.away || {});
const pick = computed(() => (props.game.pick || '').toUpperCase());
const result = computed(() => props.game.result || 'pending');
const isHomePick = computed(() => home.value.abbr && pick.value === home.value.abbr.toUpperCase());
const isAwayPick = computed(() => away.value.abbr && pick.value === away.value.abbr.toUpperCase());
const pickLabel = computed(() => {
  const abbr = pick.value;
  const info = teamInfo(abbr);
  return info ? `${info.name} (${abbr})` : abbr;
});
const resultLabel = computed(() => {
  return { correct: 'Correct', wrong: 'Wrong', pending: 'Pending' }[result.value] || 'Pending';
});
const confidence = computed(() => {
  const c = Number(props.game.confidence);
  return Number.isFinite(c) && c >= 1 && c <= 5 ? c : null;
});
const homeScore = computed(() => props.game.score?.home ?? props.game.score?.[1]);
const awayScore = computed(() => props.game.score?.away ?? props.game.score?.[0]);
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="`Week ${weekLabel} pick details`">
      <div class="modal-head">
        <div class="week-sub">{{ weekLabel || `Week ${game.week}` }}</div>
        <h3>Our Pick</h3>
      </div>
      <div class="modal-body">
        <div class="modal-matchup">
          <div class="modal-team" :class="{ picked: isHomePick }">
            <img :src="teamLogo(home)" :alt="home.name || home.abbr" />
            <div class="tname">{{ home.name || home.abbr }}</div>
            <div class="tabbr">{{ home.abbr }}</div>
          </div>
          <div class="vs" style="font-size:16px;font-weight:700">@ / vs</div>
          <div class="modal-team" :class="{ picked: isAwayPick }">
            <img :src="teamLogo(away)" :alt="away.name || away.abbr" />
            <div class="tname">{{ away.name || away.abbr }}</div>
            <div class="tabbr">{{ away.abbr }}</div>
          </div>
        </div>

        <div class="meta-row">
          <span class="chip result" :class="result">{{ resultLabel }}</span>
          <span class="chip">Pick: {{ pickLabel }}</span>
          <span v-if="confidence" class="chip">Confidence: {{ '●'.repeat(confidence) }}{{ '○'.repeat(5 - confidence) }}</span>
          <span v-if="game.picker" class="chip">By {{ game.picker }}</span>
          <span v-if="homeScore != null && awayScore != null" class="chip">Score: {{ homeScore }}–{{ awayScore }}</span>
        </div>

        <div v-if="game.rationale" class="rationale">
          <b>Why we picked it</b><br />
          {{ game.rationale }}
        </div>
        <p v-else class="empty-note">No rationale recorded yet.</p>

        <div v-if="result === 'wrong' || game.lesson" class="lesson">
          <b>What we learned</b><br />
          {{ game.lesson || 'No lesson recorded yet — we’ll update this after the game.' }}
        </div>

        <div style="margin-top: 20px; display: flex; gap: 12px">
          <button class="icon-btn" style="width:auto;padding:0 18px;border-radius:999px" @click="$emit('close')">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
