<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>
        <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
        {{ currentBatch.title }} - Flights ({{ currentBatch.flights.length }})
      </span>
      <div class="d-flex align-center" style="gap: 8px">
        <v-text-field
          v-model.number="localBatchSize"
          label="Batch Size"
          type="number"
          min="1"
          :max="currentBatch.flights.length"
          density="compact"
          style="max-width: 120px"
          hint="Flights per batch"
          persistent-hint
          :disabled="isSubmitting"
          @update:model-value="$emit('update:batchSize', localBatchSize)"
        ></v-text-field>
        <v-btn
          color="success"
          :disabled="currentBatch.flights.length === 0 || isSubmitting"
          :loading="isSubmitting"
          @click="$emit('submit-flights', localBatchSize)"
        >
          <v-icon icon="mdi-send" class="mr-1"></v-icon>
          Send to Lambda
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-alert
        v-if="batchProgress.show"
        :type="batchProgress.type"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="batchProgress.show = false"
      >
        <div class="text-body-2">
          {{ batchProgress.message }}
          <span v-if="batchProgress.currentBatch && batchProgress.totalBatches">
            (Batch {{ batchProgress.currentBatch }} of
            {{ batchProgress.totalBatches }})
          </span>
        </div>
        <v-progress-linear
          v-if="batchProgress.totalBatches > 1"
          :model-value="
            (batchProgress.currentBatch / batchProgress.totalBatches) * 100
          "
          color="primary"
          class="mt-2"
        ></v-progress-linear>
      </v-alert>
      <v-list>
        <v-list-item
          v-for="(flight, index) in currentBatch.flights"
          :key="index"
          class="mb-2"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-airplane-takeoff" color="primary"></v-icon>
          </template>

          <v-list-item-title>
            Flight {{ flight.flightNumber }}
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ flight.origin }} → {{ flight.destination }}
            <br />
            Departure: {{ formatDateTime(flight.departureTime) }}
            <br />
            Aircraft: {{ flight.aircraftId }}
            <br v-if="flight.destAltApts && flight.destAltApts.length > 0" />
            <span v-if="flight.destAltApts && flight.destAltApts.length > 0">
              Dest Alts: {{ flight.destAltApts.map((a) => a.apt).join(", ") }}
            </span>
            <br />
            Automated: {{ flight.automated ? "Yes" : "No" }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="$emit('remove-flight', index)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  currentBatch: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  batchProgress: {
    type: Object,
    required: true,
  },
  batchSize: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits([
  "submit-flights",
  "remove-flight",
  "update:batchSize",
]);

const localBatchSize = ref(props.batchSize);

watch(
  () => props.batchSize,
  (newVal) => {
    localBatchSize.value = newVal;
  }
);

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};
</script>

<style scoped></style>
