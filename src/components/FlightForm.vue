<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Build Flight
      <v-chip v-if="currentBatch" size="small" color="primary" class="ml-2">
        Adding to: {{ currentBatch.title }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-row>
          <v-col cols="12" md="6">
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">
                Flight Number (FltNum)
              </div>
              <div class="text-h6 font-weight-bold text-primary">
                {{ localFlight.flightNumber }}
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="localFlight.departureTime"
              label="Departure Time (StdUtc)"
              type="datetime-local"
              :rules="[rules.required]"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="localFlight.origin"
              label="Origin Airport (OrigApt)"
              :items="destinationOptions"
              :rules="[rules.required]"
              required
              hint="Select origin airport"
              persistent-hint
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="localFlight.destination"
              label="Destination Airport (DestApt)"
              :items="destinationOptions"
              :rules="[rules.required]"
              required
              hint="Select destination airport"
              persistent-hint
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="localFlight.aircraftId"
              label="Aircraft ID (AircraftId)"
              :items="aircraftOptions"
              :rules="[rules.required]"
              required
              hint="Select aircraft type"
              persistent-hint
            ></v-select>
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="localFlight.automated"
              label="Automated"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>

          <v-col cols="12">
            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-subtitle-1 pa-0 mb-3">
                Destination Alternate Airports (DestAltApts)
              </v-card-title>
              <div
                v-for="(alt, index) in localFlight.destAltApts"
                :key="index"
                class="mb-2"
              >
                <v-row>
                  <v-col cols="10">
                    <v-select
                      v-model="alt.apt"
                      :label="`Alternate ${index + 1}`"
                      :items="destinationOptions"
                      :rules="[rules.required]"
                      hint="Select alternate airport"
                      persistent-hint
                      density="compact"
                    ></v-select>
                  </v-col>
                  <v-col cols="2" class="d-flex align-center">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      @click="removeDestAlt(index)"
                    ></v-btn>
                  </v-col>
                </v-row>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="addDestAlt"
                prepend-icon="mdi-plus"
              >
                Add Alternate Airport
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <div class="mt-4">
          <v-btn
            color="primary"
            :disabled="!valid || !currentBatch"
            @click="handleAddFlight"
            class="mr-2"
          >
            <v-icon icon="mdi-plus" class="mr-1"></v-icon>
            Add Flight to Batch
          </v-btn>

          <v-btn color="secondary" variant="outlined" @click="handleReset">
            Reset Form
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive, watch, computed } from "vue";

const props = defineProps({
  currentBatch: {
    type: Object,
    default: null,
  },
  destinationOptions: {
    type: Array,
    required: true,
  },
  aircraftOptions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["add-flight", "reset-form"]);

const form = ref(null);
const valid = ref(false);

// Compute the next flight number based on current batch
const nextFlightNumber = computed(() => {
  if (!props.currentBatch || !props.currentBatch.batchNumber) {
    return "001";
  }

  // Find the highest flight number in the batch to avoid duplicates
  const flights = props.currentBatch.flights || [];
  let maxFlightNum = 0;

  for (const flight of flights) {
    if (flight.flightNumber) {
      // Extract the number after the dash (e.g., "100-3" -> 3)
      const parts = flight.flightNumber.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxFlightNum) {
          maxFlightNum = num;
        }
      }
    }
  }

  return `${props.currentBatch.batchNumber}-${maxFlightNum + 1}`;
});

// Helper function to get default datetime-local value (current time + 1 hour)
const getDefaultDateTime = () => {
  const date = new Date();
  date.setTime(date.getTime() + 60 * 60 * 1000);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Default values for flight form
const getDefaultFlight = () => ({
  flightNumber: nextFlightNumber.value,
  departureTime: getDefaultDateTime(),
  origin: "KATL",
  destination: "KJFK",
  aircraftId: "321NEO",
  destAltApts: [],
  automated: true,
});

const localFlight = reactive(getDefaultFlight());

// Watch for changes in the next flight number and update automatically
watch(nextFlightNumber, (newValue) => {
  localFlight.flightNumber = newValue;
});

const rules = {
  required: (value) => !!value || "This field is required",
  airportCode: (value) => {
    if (!value) return true;
    const isValid3 = value.length === 3 && /^[A-Z]{3}$/i.test(value);
    const isValid4 = value.length === 4 && /^[A-Z]{4}$/i.test(value);
    return isValid3 || isValid4 || "Must be a 3 or 4-letter airport code";
  },
};

const addDestAlt = () => {
  localFlight.destAltApts.push({ apt: "" });
};

const removeDestAlt = (index) => {
  localFlight.destAltApts.splice(index, 1);
};

const handleAddFlight = async () => {
  const { valid: isValid } = await form.value.validate();
  if (!isValid) return;

  // Filter out empty alternate airports
  const destAltApts = localFlight.destAltApts
    .filter((alt) => alt.apt && alt.apt.trim())
    .map((alt) => ({ apt: alt.apt.toUpperCase() }));

  const flightData = {
    flightNumber: localFlight.flightNumber,
    departureTime: localFlight.departureTime,
    origin: localFlight.origin.toUpperCase(),
    destination: localFlight.destination.toUpperCase(),
    aircraftId: localFlight.aircraftId,
    destAltApts: destAltApts,
    automated: localFlight.automated,
  };

  console.log("[FlightForm] Emitting flight data:", flightData);

  emit("add-flight", flightData);
};

const handleReset = () => {
  Object.assign(localFlight, getDefaultFlight());
  form.value?.resetValidation();
  emit("reset-form");
};

// Expose reset method for parent
defineExpose({
  reset: handleReset,
});
</script>

<style scoped></style>
