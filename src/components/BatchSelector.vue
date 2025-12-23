<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>
        <v-icon icon="mdi-folder-multiple" class="mr-2"></v-icon>
        Flight Batches
      </span>
      <div class="d-flex align-center" style="gap: 8px">
        <v-btn
          v-if="batchList.length > 0"
          color="primary"
          variant="elevated"
          @click="$emit('show-all-batches')"
          prepend-icon="mdi-view-grid"
        >
          View All Batches ({{ batchList.length }})
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="$emit('create-batch')"
          prepend-icon="mdi-plus"
        >
          New Batch
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-select
        :model-value="currentBatchId"
        :items="batchOptions"
        label="Select Active Batch"
        item-title="title"
        item-value="id"
        @update:model-value="handleBatchChange"
        hint="Select a batch to add flights to"
        persistent-hint
        class="mb-4"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-icon icon="mdi-folder" class="mr-2"></v-icon>
            </template>
            <v-list-item-subtitle>
              {{ batches[item.raw.id]?.flights?.length || 0 }} flights
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-select>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  batches: {
    type: Object,
    required: true,
  },
  currentBatchId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "update:currentBatchId",
  "create-batch",
  "delete-batch",
  "show-all-batches",
]);

const currentBatch = computed(() => {
  if (!props.currentBatchId) return null;
  return props.batches[props.currentBatchId] || null;
});

const batchOptions = computed(() => {
  return Object.values(props.batches).map((batch) => ({
    id: batch.id,
    title: batch.batchNumber ? `${batch.batchNumber} - ${batch.title}` : batch.title,
  }));
});

const batchList = computed(() => {
  return Object.values(props.batches);
});

const handleBatchChange = (batchId) => {
  if (batchId) {
    emit("update:currentBatchId", batchId);
  }
};
</script>

<style scoped></style>
