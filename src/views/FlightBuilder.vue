<template>
  <v-container>
    <!-- Batch Management Section -->
    <v-row>
      <v-col cols="12">
        <BatchSelector
          :batches="batches"
          :current-batch-id="currentBatchId"
          @update:currentBatchId="onBatchChange"
          @create-batch="createNewBatch"
          @delete-batch="deleteBatch"
        />
      </v-col>
    </v-row>

    <!-- Flight Form -->
    <v-row>
      <v-col cols="12">
        <FlightForm
          ref="flightFormRef"
          :current-batch="currentBatch"
          :destination-options="destinationOptions"
          :aircraft-options="aircraftOptions"
          @add-flight="addFlight"
          @reset-form="handleFormReset"
        />
      </v-col>
    </v-row>

    <!-- Flight List -->
    <v-row v-if="currentBatch && currentBatch.flights.length > 0">
      <v-col cols="12">
        <FlightList
          :current-batch="currentBatch"
          :is-submitting="isSubmitting"
          :batch-progress="batchProgress"
          :batch-size="batchSize"
          @submit-flights="submitFlights"
          @remove-flight="removeFlight"
          @update:batchSize="batchSize = $event"
        />
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      top
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Close </v-btn>
      </template>
    </v-snackbar>

    <!-- Create Batch Dialog -->
    <CreateBatchDialog v-model="newBatchDialog" @create="confirmCreateBatch" />
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { invokeLambda } from "../services/api";
import BatchSelector from "../components/BatchSelector.vue";
import CreateBatchDialog from "../components/CreateBatchDialog.vue";
import FlightForm from "../components/FlightForm.vue";
import FlightList from "../components/FlightList.vue";

const flightFormRef = ref(null);
const isSubmitting = ref(false);
const batchSize = ref(10);
const currentBatchId = ref(null);
const batches = ref({});
const newBatchDialog = ref(false);

// Computed properties
const currentBatch = computed(() => {
  if (!currentBatchId.value) return null;
  return batches.value[currentBatchId.value] || null;
});

const batchProgress = reactive({
  show: false,
  message: "",
  type: "info",
  currentBatch: 0,
  totalBatches: 0,
});

// Dropdown options
const destinationOptions = [
  "KJFK", // New York JFK
  "KATL", // Atlanta
  "KLAX", // Los Angeles
  "KORD", // Chicago O'Hare
  "KDFW", // Dallas/Fort Worth
  "KDEN", // Denver
  "KSEA", // Seattle
  "KLAS", // Las Vegas
  "KMIA", // Miami
  "KBOS", // Boston
  "KSFO", // San Francisco
  "KIAD", // Washington Dulles
  "KPHX", // Phoenix
  "KCLT", // Charlotte
  "KDTW", // Detroit
  "KPHL", // Philadelphia
  "KLGA", // New York LaGuardia
  "KBWI", // Baltimore
  "KMSP", // Minneapolis
  "KSLC", // Salt Lake City
];

const aircraftOptions = ["321NEO", "A320", "A321", "A350", "A380"];

// Helper function to get default datetime-local value (current time + 1 hour)
const getDefaultDateTime = () => {
  const date = new Date();
  date.setTime(date.getTime() + 60 * 60 * 1000); // Add 1 hour (60 minutes * 60 seconds * 1000 ms)
  date.setSeconds(0);
  date.setMilliseconds(0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const snackbar = reactive({
  show: false,
  message: "",
  color: "success",
});

// Batch management functions
const generateBatchId = () => {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createNewBatch = () => {
  newBatchDialog.value = true;
};

const confirmCreateBatch = (batchName) => {
  const batchId = generateBatchId();
  const batch = {
    id: batchId,
    title: batchName,
    flights: [],
    createdAt: new Date().toISOString(),
  };

  batches.value[batchId] = batch;
  currentBatchId.value = batchId;

  // Save to localStorage
  saveBatchesToStorage();

  showSnackbar(`Batch "${batch.title}" created!`, "success");
};

const onBatchChange = (batchId) => {
  currentBatchId.value = batchId;
  saveBatchesToStorage();
};

const deleteBatch = (batchId) => {
  if (!batches.value[batchId]) return;

  const batch = batches.value[batchId];
  if (batch.flights.length > 0) {
    showSnackbar(
      "Cannot delete batch with flights. Remove flights first.",
      "warning"
    );
    return;
  }

  delete batches.value[batchId];

  // If deleted batch was current, select another or clear
  if (currentBatchId.value === batchId) {
    const remainingBatches = Object.values(batches.value);
    currentBatchId.value =
      remainingBatches.length > 0 ? remainingBatches[0].id : null;
  }

  saveBatchesToStorage();
  showSnackbar(`Batch "${batch.title}" deleted`, "info");
};

// LocalStorage persistence
const saveBatchesToStorage = () => {
  try {
    localStorage.setItem("flightBatches", JSON.stringify(batches.value));
    localStorage.setItem("currentBatchId", currentBatchId.value);
  } catch (error) {
    console.error("Error saving batches to localStorage:", error);
  }
};

const loadBatchesFromStorage = () => {
  try {
    const saved = localStorage.getItem("flightBatches");
    const savedCurrentId = localStorage.getItem("currentBatchId");

    if (saved) {
      batches.value = JSON.parse(saved);
    }

    if (savedCurrentId && batches.value[savedCurrentId]) {
      currentBatchId.value = savedCurrentId;
    } else if (Object.keys(batches.value).length > 0) {
      // Select first batch if current doesn't exist
      currentBatchId.value = Object.values(batches.value)[0].id;
    }
  } catch (error) {
    console.error("Error loading batches from localStorage:", error);
  }
};

// Initialize with default batch if none exist
onMounted(() => {
  loadBatchesFromStorage();

  // Create default batch if none exist
  if (Object.keys(batches.value).length === 0) {
    const defaultBatch = {
      id: generateBatchId(),
      title: "Default Batch",
      flights: [],
      createdAt: new Date().toISOString(),
    };
    batches.value[defaultBatch.id] = defaultBatch;
    currentBatchId.value = defaultBatch.id;
    saveBatchesToStorage();
  }
});

const addFlight = (flightData) => {
  if (!currentBatch.value) {
    showSnackbar("Please select or create a batch first", "warning");
    return;
  }

  currentBatch.value.flights.push({ ...flightData });
  saveBatchesToStorage();

  // Reset the form
  if (flightFormRef.value) {
    flightFormRef.value.reset();
  }

  showSnackbar(`Flight added to "${currentBatch.value.title}"!`, "success");
};

const handleFormReset = () => {
  // Form reset is handled by the component itself
};

const removeFlight = (index) => {
  if (!currentBatch.value) return;
  currentBatch.value.flights.splice(index, 1);
  saveBatchesToStorage();
  showSnackbar("Flight removed", "info");
};

const submitFlights = async (size) => {
  if (!currentBatch.value || currentBatch.value.flights.length === 0) return;

  // Update batchSize to keep it in sync
  batchSize.value = Math.max(1, Math.floor(size) || 10);

  const flightsToSubmit = currentBatch.value.flights;
  const batchSizeValue = batchSize.value;
  const batches = [];

  // Split flights into batches
  for (let i = 0; i < flightsToSubmit.length; i += batchSizeValue) {
    batches.push(flightsToSubmit.slice(i, i + batchSizeValue));
  }

  isSubmitting.value = true;
  batchProgress.totalBatches = batches.length;
  batchProgress.show = true;
  batchProgress.type = "info";

  let successCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < batches.length; i++) {
      batchProgress.currentBatch = i + 1;
      batchProgress.message = `Sending batch ${i + 1} of ${batches.length} (${
        batches[i].length
      } flights)...`;

      try {
        const response = await invokeLambda(batches[i]);
        successCount += batches[i].length;
        console.log(`Batch ${i + 1} response:`, response);

        // If this is the last batch, show final success message
        if (i === batches.length - 1) {
          if (errorCount === 0) {
            batchProgress.message = `All ${successCount} flights sent successfully!`;
            batchProgress.type = "success";
            showSnackbar(
              `Successfully sent ${successCount} flights in ${batches.length} batch(es)!`,
              "success"
            );
          } else {
            batchProgress.message = `Completed: ${successCount} succeeded, ${errorCount} failed`;
            batchProgress.type = "warning";
            showSnackbar(
              `Completed with errors: ${successCount} succeeded, ${errorCount} failed`,
              "warning"
            );
          }
        }
      } catch (error) {
        errorCount += batches[i].length;
        console.error(`Error in batch ${i + 1}:`, error);

        // Continue with next batch even if one fails
        if (i === batches.length - 1) {
          if (successCount > 0) {
            batchProgress.message = `Completed with errors: ${successCount} succeeded, ${errorCount} failed`;
            batchProgress.type = "warning";
            showSnackbar(
              `Some batches failed: ${successCount} succeeded, ${errorCount} failed`,
              "warning"
            );
          } else {
            batchProgress.message = `All batches failed. Last error: ${
              error.response?.data?.message || error.message
            }`;
            batchProgress.type = "error";
            showSnackbar(
              error.response?.data?.message ||
                "Error sending flights to Lambda",
              "error"
            );
          }
        }
      }
    }
  } catch (error) {
    batchProgress.message = `Unexpected error: ${error.message}`;
    batchProgress.type = "error";
    showSnackbar("Unexpected error occurred", "error");
    console.error("Unexpected error:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const showSnackbar = (message, color = "success") => {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
};
</script>

<style scoped></style>
