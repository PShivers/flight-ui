<template>
  <v-container fluid>
    <!-- Batch Management Section -->
    <v-row>
      <v-col cols="12">
        <BatchSelector
          :batches="batches"
          :current-batch-id="currentBatchId"
          @update:currentBatchId="onBatchChange"
          @create-batch="createNewBatch"
          @delete-batch="deleteBatch"
          @show-all-batches="allBatchesDialog = true"
        />
      </v-col>
    </v-row>

    <!-- Main Content with Sidebar -->
    <v-row>
      <!-- Batch Sidebar (Left) -->
      <v-col cols="12" md="4" lg="3">
        <BatchSidebar
          v-if="currentBatch"
          :current-batch="currentBatch"
          :is-submitting="isSubmitting"
          :batch-progress="batchProgress"
          @submit-flights="submitFlights"
          @remove-flight="removeFlight"
          @edit-flight="handleEditFlight"
        />
        <v-card v-else>
          <v-card-text class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-folder-open-outline
            </v-icon>
            <div class="text-h6 mb-2">No Batch Selected</div>
            <div class="text-body-2 text-grey mb-4">
              Create a new batch to get started with building flights
            </div>
            <v-btn
              color="primary"
              variant="elevated"
              @click="createNewBatch"
            >
              <v-icon start>mdi-plus</v-icon>
              Create Batch
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Flight Form (Right) -->
      <v-col cols="12" md="8" lg="9">
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

    <!-- All Batches Dialog -->
    <AllBatchesDialog
      v-model="allBatchesDialog"
      :batches="batches"
      :current-batch-id="currentBatchId"
      @update:currentBatchId="onBatchChange"
      @delete-batch="deleteBatch"
    />
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { invokeLambda } from "../services/api";
import batchApi from "../services/batchApi";
import BatchSelector from "../components/BatchSelector.vue";
import CreateBatchDialog from "../components/CreateBatchDialog.vue";
import FlightForm from "../components/FlightForm.vue";
import BatchSidebar from "../components/BatchSidebar.vue";
import AllBatchesDialog from "../components/AllBatchesDialog.vue";

const flightFormRef = ref(null);
const isSubmitting = ref(false);
const currentBatchId = ref(null);
const batches = ref({});
const newBatchDialog = ref(false);
const allBatchesDialog = ref(false);
const editingFlightId = ref(null);

// Computed properties
const currentBatch = computed(() => {
  if (!currentBatchId.value) return null;
  return batches.value[currentBatchId.value] || null;
});

const batchProgress = reactive({
  show: false,
  message: "",
  type: "info",
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
const createNewBatch = () => {
  newBatchDialog.value = true;
};

const confirmCreateBatch = async (batchName) => {
  try {
    // Get next batch number from backend
    const { nextBatchNumber } = await batchApi.getNextBatchNumber();

    const batch = await batchApi.createBatch(batchName, nextBatchNumber);
    batches.value[batch.id] = batch;
    currentBatchId.value = batch.id;

    showSnackbar(`Batch "${batch.title}" (${batch.batchNumber}) created!`, "success");
  } catch (error) {
    console.error("Error creating batch:", error);
    showSnackbar("Failed to create batch", "error");
  }
};

const onBatchChange = (batchId) => {
  currentBatchId.value = batchId;
};

const deleteBatch = async (batchId) => {
  if (!batches.value[batchId]) return;

  const batch = batches.value[batchId];
  if (batch.flights && batch.flights.length > 0) {
    showSnackbar(
      "Cannot delete batch with flights. Remove flights first.",
      "warning"
    );
    return;
  }

  try {
    await batchApi.deleteBatch(batchId);
    delete batches.value[batchId];

    // If deleted batch was current, select another or clear
    if (currentBatchId.value === batchId) {
      const remainingBatches = Object.values(batches.value);
      currentBatchId.value =
        remainingBatches.length > 0 ? remainingBatches[0].id : null;
    }

    showSnackbar(`Batch "${batch.title}" deleted`, "info");
  } catch (error) {
    console.error("Error deleting batch:", error);
    showSnackbar("Failed to delete batch", "error");
  }
};

// Data loading
const loadBatchesFromAPI = async () => {
  try {
    const batchData = await batchApi.getBatches();
    batches.value = batchData;

    // Set current batch to first available or null
    const batchIds = Object.keys(batchData);
    if (batchIds.length > 0) {
      currentBatchId.value = batchIds[0];
    } else {
      currentBatchId.value = null;
    }
  } catch (error) {
    console.error("Error loading batches from API:", error);
    showSnackbar("Failed to load batches", "error");
  }
};

// Initialize data
onMounted(async () => {
  await loadBatchesFromAPI();

  // Create default batch if none exist
  if (Object.keys(batches.value).length === 0) {
    try {
      const { nextBatchNumber } = await batchApi.getNextBatchNumber();
      const defaultBatch = await batchApi.createBatch("Default Batch", nextBatchNumber);
      batches.value[defaultBatch.id] = defaultBatch;
      currentBatchId.value = defaultBatch.id;
    } catch (error) {
      console.error("Error creating default batch:", error);
    }
  }
});

const addFlight = async (flightData) => {
  if (!currentBatch.value) {
    showSnackbar("Please select or create a batch first", "warning");
    return;
  }

  try {
    // Check if we're editing an existing flight
    if (editingFlightId.value) {
      // Update existing flight
      await batchApi.updateFlight(editingFlightId.value, flightData);

      // Find and update the flight in the local array
      const flightIndex = currentBatch.value.flights.findIndex(
        f => f.id === editingFlightId.value
      );
      if (flightIndex !== -1) {
        currentBatch.value.flights[flightIndex] = {
          ...currentBatch.value.flights[flightIndex],
          ...flightData,
        };
      }

      showSnackbar("Flight updated successfully!", "success");
      editingFlightId.value = null;
    } else {
      // Add new flight
      const newFlight = await batchApi.addFlight(
        currentBatch.value.id,
        flightData
      );

      currentBatch.value.flights.push(newFlight);

      showSnackbar(`Flight added to "${currentBatch.value.title}"!`, "success");
    }

    // Reset the form
    if (flightFormRef.value) {
      flightFormRef.value.reset();
    }
  } catch (error) {
    console.error("Error saving flight:", error);
    showSnackbar("Failed to save flight", "error");
  }
};

const handleFormReset = () => {
  // Clear editing state when form is reset or cancelled
  editingFlightId.value = null;
};

const removeFlight = async (index) => {
  if (!currentBatch.value) return;

  const flight = currentBatch.value.flights[index];
  if (!flight) return;

  try {
    await batchApi.deleteFlight(flight.id);
    currentBatch.value.flights.splice(index, 1);

    // Renumber all remaining flights sequentially
    const batchNumber = currentBatch.value.batchNumber;
    for (let i = 0; i < currentBatch.value.flights.length; i++) {
      const newFlightNumber = `${batchNumber}-${i + 1}`;
      const flightToUpdate = currentBatch.value.flights[i];

      // Only update if the flight number has changed
      if (flightToUpdate.flightNumber !== newFlightNumber) {
        flightToUpdate.flightNumber = newFlightNumber;

        // Update in the database
        await batchApi.updateFlight(flightToUpdate.id, {
          flightNumber: newFlightNumber,
          origin: flightToUpdate.origin,
          destination: flightToUpdate.destination,
          departureTime: flightToUpdate.departureTime,
          arrivalTime: flightToUpdate.arrivalTime,
          aircraftType: flightToUpdate.aircraftType,
        });
      }
    }

    showSnackbar("Flight removed and flights renumbered", "info");
  } catch (error) {
    console.error("Error removing flight:", error);
    showSnackbar("Failed to remove flight", "error");
  }
};

const handleEditFlight = ({ flight }) => {
  // Load the flight data into the form
  editingFlightId.value = flight.id;
  if (flightFormRef.value) {
    flightFormRef.value.loadFlight(flight);
  }
};


const submitFlights = async () => {
  if (!currentBatch.value || currentBatch.value.flights.length === 0) return;

  const flightsToSubmit = currentBatch.value.flights;

  isSubmitting.value = true;
  batchProgress.show = true;
  batchProgress.type = "info";
  batchProgress.message = `Sending ${flightsToSubmit.length} flight(s)...`;

  try {
    await invokeLambda(flightsToSubmit);

    batchProgress.message = `All ${flightsToSubmit.length} flight(s) sent successfully!`;
    batchProgress.type = "success";
    showSnackbar(
      `Successfully sent ${flightsToSubmit.length} flight(s)!`,
      "success"
    );
  } catch (error) {
    console.error("Error submitting flights:", error);
    batchProgress.message = `Failed to send flights: ${
      error.response?.data?.message || error.message
    }`;
    batchProgress.type = "error";
    showSnackbar(
      error.response?.data?.message || "Error sending flights to Lambda",
      "error"
    );
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
