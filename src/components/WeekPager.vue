<script setup>
import { computed } from 'vue';

const props = defineProps({
  weeks: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
});

const emit = defineEmits(['select']);

const count = computed(() => props.weeks.length);
const current = computed(() => props.weeks[props.index] || null);

function go(delta) {
  const next = Math.min(Math.max(0, props.index + delta), count.value - 1);
  emit('select', next);
}

function jump(i) {
  emit('select', Math.min(Math.max(0, i), count.value - 1));
}

const label = computed(() => {
  if (!current.value) return '—';
  return `Week ${current.value.week} · ${current.value.year}`;
});
</script>

<template>
  <div class="week-pager card" style="padding: 14px 18px">
    <div class="controls">
      <button class="icon-btn" :disabled="index <= 0" @click="go(-1)" aria-label="Previous week">‹</button>
      <button class="icon-btn" :disabled="index >= count - 1" @click="go(1)" aria-label="Next week">›</button>
      <div>
        <div class="week-label">{{ label }}</div>
        <div v-if="current" class="week-sub">
          Week {{ current.week }} · {{ current.year }} · {{ current.games?.length || 0 }} games
        </div>
      </div>
    </div>
    <div class="controls">
      <select
        class="chip"
        style="padding: 8px 12px; font-family: inherit"
        :value="index"
        @change="$emit('select', Number($event.target.value))"
      >
        <option v-for="(w, i) in weeks" :key="`${w.year}-${w.week}`" :value="i">
          Week {{ w.week }} · {{ w.year }}
        </option>
      </select>
    </div>
  </div>
</template>
