<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-plus-circle" class="mr-2"></v-icon>
            Build Flights
          </v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.flightNumber"
                    label="Flight Number (FltNum)"
                    :rules="[rules.required]"
                    required
                    hint="Flight number (e.g., 001, 123)"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.departureTime"
                    label="Departure Time (StdUtc)"
                    type="datetime-local"
                    :rules="[rules.required]"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.origin"
                    label="Origin Airport (OrigApt)"
                    :rules="[rules.required, rules.airportCode]"
                    required
                    hint="4-letter airport code (e.g., KATL, KJFK)"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.destination"
                    label="Destination Airport (DestApt)"
                    :rules="[rules.required, rules.airportCode]"
                    required
                    hint="4-letter airport code (e.g., KJFK, KLGA)"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.originAltApt"
                    label="Origin Alternate Airport (OrigAltApt)"
                    :rules="[rules.airportCode]"
                    hint="Optional - 4-letter airport code (e.g., KCHA)"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="flight.aircraftId"
                    label="Aircraft ID (AircraftId)"
                    :rules="[rules.required]"
                    required
                    hint="Aircraft identifier (e.g., 321NEO)"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-switch
                    v-model="flight.automated"
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
                    <div v-for="(alt, index) in flight.destAltApts" :key="index" class="mb-2">
                      <v-row>
                        <v-col cols="10">
                          <v-text-field
                            v-model="alt.apt"
                            :label="`Alternate ${index + 1}`"
                            :rules="[rules.airportCode]"
                            hint="4-letter airport code"
                            persistent-hint
                            density="compact"
                          ></v-text-field>
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
              
              <v-btn
                color="primary"
                :disabled="!valid"
                @click="addFlight"
                class="mr-2"
              >
                <v-icon icon="mdi-plus" class="mr-1"></v-icon>
                Add Flight
              </v-btn>
              
              <v-btn
                color="secondary"
                variant="outlined"
                @click="resetForm"
              >
                Reset Form
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row v-if="flights.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>
              <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
              Flights ({{ flights.length }})
            </span>
            <v-btn
              color="success"
              :disabled="flights.length === 0 || isSubmitting"
              :loading="isSubmitting"
              @click="submitFlights"
            >
              <v-icon icon="mdi-send" class="mr-1"></v-icon>
              Send to Lambda
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(flight, index) in flights"
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
                  <br>
                  Departure: {{ formatDateTime(flight.departureTime) }}
                  <br>
                  Aircraft: {{ flight.aircraftId }}
                  <span v-if="flight.originAltApt"> | Orig Alt: {{ flight.originAltApt }}</span>
                  <br v-if="flight.destAltApts && flight.destAltApts.length > 0">
                  <span v-if="flight.destAltApts && flight.destAltApts.length > 0">
                    Dest Alts: {{ flight.destAltApts.map(a => a.apt).join(', ') }}
                  </span>
                  <br>
                  Automated: {{ flight.automated ? 'Yes' : 'No' }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeFlight(index)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      top
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { invokeLambda } from '../services/api'

const form = ref(null)
const valid = ref(false)
const flights = ref([])
const isSubmitting = ref(false)

const flight = reactive({
  flightNumber: '',
  departureTime: '',
  origin: '',
  destination: '',
  originAltApt: '',
  aircraftId: '',
  destAltApts: [],
  automated: true
})

const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

const rules = {
  required: value => !!value || 'This field is required',
  airportCode: value => {
    if (!value) return true
    const isValid3 = value.length === 3 && /^[A-Z]{3}$/i.test(value)
    const isValid4 = value.length === 4 && /^[A-Z]{4}$/i.test(value)
    return isValid3 || isValid4 || 'Must be a 3 or 4-letter airport code'
  }
}

const addDestAlt = () => {
  flight.destAltApts.push({ apt: '' })
}

const removeDestAlt = (index) => {
  flight.destAltApts.splice(index, 1)
}

const addFlight = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return
  
  // Filter out empty alternate airports
  const destAltApts = flight.destAltApts
    .filter(alt => alt.apt && alt.apt.trim())
    .map(alt => ({ apt: alt.apt.toUpperCase() }))
  
  const flightData = {
    flightNumber: flight.flightNumber,
    departureTime: flight.departureTime,
    origin: flight.origin.toUpperCase(),
    destination: flight.destination.toUpperCase(),
    originAltApt: flight.originAltApt ? flight.originAltApt.toUpperCase() : null,
    aircraftId: flight.aircraftId,
    destAltApts: destAltApts,
    automated: flight.automated
  }
  
  flights.value.push({ ...flightData })
  resetForm()
  showSnackbar('Flight added successfully!', 'success')
}

const removeFlight = (index) => {
  flights.value.splice(index, 1)
  showSnackbar('Flight removed', 'info')
}

const resetForm = () => {
  Object.assign(flight, {
    flightNumber: '',
    departureTime: '',
    origin: '',
    destination: '',
    originAltApt: '',
    aircraftId: '',
    destAltApts: [],
    automated: true
  })
  form.value?.resetValidation()
}

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return ''
  const date = new Date(dateTimeString)
  return date.toLocaleString()
}

const submitFlights = async () => {
  if (flights.value.length === 0) return
  
  isSubmitting.value = true
  try {
    const response = await invokeLambda(flights.value)
    showSnackbar('Flights sent to Lambda successfully!', 'success')
    console.log('Lambda response:', response)
    // Optionally clear flights after successful submission
    // flights.value = []
  } catch (error) {
    showSnackbar(
      error.response?.data?.message || 'Error sending flights to Lambda',
      'error'
    )
    console.error('Error:', error)
  } finally {
    isSubmitting.value = false
  }
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
</style>

