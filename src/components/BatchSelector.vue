<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>
        <v-icon icon="mdi-folder-multiple" class="mr-2"></v-icon>
        Flight Batches
      </span>
      <v-btn
        color="primary"
        @click="$emit('create-batch')"
        prepend-icon="mdi-plus"
      >
        New Batch
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-select
        :model-value="currentBatchId"
        :items="batchOptions"
        label="Select Batch"
        item-title="title"
        item-value="id"
        return-object
        @update:model-value="handleBatchChange"
        hint="Select a batch to add flights to"
        persistent-hint
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-icon icon="mdi-folder" class="mr-2"></v-icon>
            </template>
            <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ batches[item.raw.id]?.flights?.length || 0 }} flights
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                size="small"
                @click.stop="$emit('delete-batch', item.raw.id)"
                :disabled="batches[item.raw.id]?.flights?.length > 0"
              ></v-btn>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <v-alert v-if="currentBatch" type="info" variant="tonal" class="mt-3">
        <div class="d-flex align-center justify-space-between">
          <span>
            <strong>{{ currentBatch.title }}</strong>
            <span class="ml-2"
              >({{ currentBatch.flights.length }} flights)</span
            >
          </span>
          <v-chip size="small" color="primary"> Active Batch </v-chip>
        </div>
      </v-alert>
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
]);

const currentBatch = computed(() => {
  if (!props.currentBatchId) return null;
  return props.batches[props.currentBatchId] || null;
});

const batchOptions = computed(() => {
  return Object.values(props.batches).map((batch) => ({
    id: batch.id,
    title: batch.title,
  }));
});

const handleBatchChange = (batch) => {
  if (batch && batch.id) {
    emit("update:currentBatchId", batch.id);
  }
};
</script>

<style scoped></style>
