<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">Edit Flight</span>
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
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn color="primary" :disabled="!valid" @click="handleSave">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  flight: {
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

const emit = defineEmits(["update:modelValue", "save"]);

const form = ref(null);
const valid = ref(false);

const localFlight = reactive({
  flightNumber: "",
  departureTime: "",
  origin: "",
  destination: "",
  aircraftId: "",
  destAltApts: [],
  automated: true,
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

const handleSave = async () => {
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

  emit("save", flightData);
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.flight) {
      // Convert datetime-local format
      const date = new Date(props.flight.departureTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

      Object.assign(localFlight, {
        flightNumber: props.flight.flightNumber || "",
        departureTime: datetimeLocal,
        origin: props.flight.origin || "",
        destination: props.flight.destination || "",
        aircraftId: props.flight.aircraftId || "",
        destAltApts: props.flight.destAltApts
          ? [...props.flight.destAltApts]
          : [],
        automated: props.flight.automated ?? true,
      });
    }
  }
);
</script>

<style scoped></style>
