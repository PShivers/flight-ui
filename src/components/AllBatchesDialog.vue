<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>
          <v-icon icon="mdi-folder-multiple" class="mr-2"></v-icon>
          All Batches
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <div v-if="batchList.length === 0" class="text-center py-8">
          <v-icon
            icon="mdi-folder-off"
            size="48"
            color="grey-lighten-1"
          ></v-icon>
          <div class="text-body-2 text-medium-emphasis mt-2">
            No batches created yet
          </div>
        </div>

        <v-row v-else>
          <v-col
            v-for="batch in batchList"
            :key="batch.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              :variant="batch.id === currentBatchId ? 'elevated' : 'outlined'"
              :color="batch.id === currentBatchId ? 'primary' : ''"
              class="cursor-pointer"
              @click="handleBatchChange({ id: batch.id })"
            >
              <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon
                    :icon="
                      batch.id === currentBatchId
                        ? 'mdi-folder-open'
                        : 'mdi-folder'
                    "
                    class="mr-2"
                  ></v-icon>
                  <span class="text-body-1">
                    <span v-if="batch.batchNumber">{{ batch.batchNumber }} - </span>{{ batch.title }}
                  </span>
                </div>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click.stop="$emit('delete-batch', batch.id)"
                  :disabled="batch.flights.length > 0"
                ></v-btn>
              </v-card-title>
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption">
                    {{ batch.flights.length }} flight{{
                      batch.flights.length !== 1 ? "s" : ""
                    }}
                  </span>
                  <v-chip
                    v-if="batch.id === currentBatchId"
                    size="x-small"
                    color="white"
                    text-color="primary"
                  >
                    Active
                  </v-chip>
                </div>
                <div
                  v-if="batch.createdAt"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  Created: {{ formatDate(batch.createdAt) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
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
  "update:modelValue",
  "update:currentBatchId",
  "delete-batch",
]);

const batchList = computed(() => {
  return Object.values(props.batches);
});

const handleBatchChange = (batch) => {
  if (batch && batch.id) {
    emit("update:currentBatchId", batch.id);
    emit("update:modelValue", false);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
