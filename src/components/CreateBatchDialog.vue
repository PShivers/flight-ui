<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">Create New Batch</span>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="localBatchName"
          label="Batch Name"
          :rules="[rules.required, rules.batchName]"
          hint="Enter a name for this batch"
          persistent-hint
          autofocus
          @keyup.enter="handleCreate"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!localBatchName || !isValidBatchName(localBatchName)"
          @click="handleCreate"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "create"]);

const localBatchName = ref("");

const rules = {
  required: (value) => !!value || "This field is required",
  batchName: (value) => {
    if (!value) return true;
    return value.trim().length > 0 || "Batch name cannot be empty";
  },
};

const isValidBatchName = (name) => {
  return name && name.trim().length > 0;
};

const handleCreate = () => {
  if (!isValidBatchName(localBatchName.value)) return;

  emit("create", localBatchName.value.trim());
  localBatchName.value = "";
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      localBatchName.value = "";
    }
  }
);
</script>

<style scoped></style>
