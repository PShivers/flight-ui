<template>
  <v-card class="sidebar-card">
    <v-card-title class="bg-primary text-white">
      <span v-if="currentBatch.batchNumber"
        >{{ currentBatch.batchNumber }} - </span
      >{{ currentBatch.title }}
    </v-card-title>

    <v-card-text class="sidebar-content">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <div class="text-subtitle-1">
            {{ currentBatch.flights.length }} Flights
          </div>
          <div class="text-caption text-medium-emphasis">
            Created: {{ formatDate(currentBatch.createdAt) }}
          </div>
        </div>
        <v-btn
          color="success"
          :disabled="currentBatch.flights.length === 0 || isSubmitting"
          :loading="isSubmitting"
          @click="$emit('submit-flights')"
          size="small"
        >
          <v-icon icon="mdi-send" class="mr-1"></v-icon>
          Send
        </v-btn>
      </div>

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
        </div>
      </v-alert>

      <v-divider class="mb-4"></v-divider>

      <div v-if="currentBatch.flights.length === 0" class="text-center py-8">
        <v-icon
          icon="mdi-airplane-off"
          size="48"
          color="grey-lighten-1"
        ></v-icon>
        <div class="text-body-2 text-medium-emphasis mt-2">
          No flights in this batch
        </div>
      </div>

      <v-list v-else density="compact">
        <v-list-item
          v-for="(flight, index) in currentBatch.flights"
          :key="flight.id || index"
          class="mb-2"
          @click="isDeleting ? null : $emit('edit-flight', { flight, index })"
          :style="{ cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.6 : 1 }"
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
            <span class="text-caption">{{
              formatDateTime(flight.departureTime)
            }}</span>
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              :disabled="isDeleting"
              :loading="isDeleting"
              @click.stop="$emit('remove-flight', index)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  currentBatch: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
  batchProgress: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["submit-flights", "remove-flight", "edit-flight"]);

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.sidebar-card {
  height: calc(100vh - 200px);
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}
</style>
