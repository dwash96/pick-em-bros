<script setup>
import GameCard from './GameCard.vue';

defineProps({
  week: { type: Object, required: true },
});

defineEmits(['open']);
</script>

<template>
  <div class="games-grid">
    <GameCard
      v-for="(game, i) in week.games || []"
      :key="`${game.home?.abbr}-${game.away?.abbr}-${i}`"
      :game="game"
      @click="$emit('open', game)"
    />
    <p v-if="!(week.games && week.games.length)" class="empty-note">
      No games recorded for this week.
    </p>
  </div>
</template>
