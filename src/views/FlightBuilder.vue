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
                  <v-select
                    v-model="flight.destination"
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
                    v-model="flight.aircraftId"
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
              
              <div class="mt-4">
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
              </div>
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
            <div class="d-flex align-center" style="gap: 8px;">
              <v-text-field
                v-model.number="batchSize"
                label="Batch Size"
                type="number"
                min="1"
                :max="flights.length"
                density="compact"
                style="max-width: 120px;"
                hint="Flights per batch"
                persistent-hint
                :disabled="isSubmitting"
              ></v-text-field>
              <v-btn
                color="success"
                :disabled="flights.length === 0 || isSubmitting"
                :loading="isSubmitting"
                @click="submitFlights"
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
                  (Batch {{ batchProgress.currentBatch }} of {{ batchProgress.totalBatches }})
                </span>
              </div>
              <v-progress-linear
                v-if="batchProgress.totalBatches > 1"
                :model-value="(batchProgress.currentBatch / batchProgress.totalBatches) * 100"
                color="primary"
                class="mt-2"
              ></v-progress-linear>
            </v-alert>
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
const batchSize = ref(10)

const batchProgress = reactive({
  show: false,
  message: '',
  type: 'info',
  currentBatch: 0,
  totalBatches: 0
})

// Dropdown options
const destinationOptions = [
  'KJFK', // New York JFK
  'KATL', // Atlanta
  'KLAX', // Los Angeles
  'KORD', // Chicago O'Hare
  'KDFW', // Dallas/Fort Worth
  'KDEN', // Denver
  'KSEA', // Seattle
  'KLAS', // Las Vegas
  'KMIA', // Miami
  'KBOS', // Boston
  'KSFO', // San Francisco
  'KIAD', // Washington Dulles
  'KPHX', // Phoenix
  'KCLT', // Charlotte
  'KDTW', // Detroit
  'KPHL', // Philadelphia
  'KLGA', // New York LaGuardia
  'KBWI', // Baltimore
  'KMSP', // Minneapolis
  'KSLC'  // Salt Lake City
]

const aircraftOptions = [
  '321NEO',
  'A320',
  'A321',
  'A350',
  'A380'
]

// Helper function to get default datetime-local value (current time + 1 hour)
const getDefaultDateTime = () => {
  const date = new Date()
  date.setTime(date.getTime() + 60 * 60 * 1000) // Add 1 hour (60 minutes * 60 seconds * 1000 ms)
  date.setSeconds(0)
  date.setMilliseconds(0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Default values for flight form
const getDefaultFlight = () => ({
  flightNumber: '001',
  departureTime: getDefaultDateTime(),
  origin: 'KATL',
  destination: 'KJFK',
  aircraftId: '321NEO',
  destAltApts: [],
  automated: true
})

const flight = reactive(getDefaultFlight())

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
  Object.assign(flight, getDefaultFlight())
  form.value?.resetValidation()
}

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return ''
  const date = new Date(dateTimeString)
  return date.toLocaleString()
}

const submitFlights = async () => {
  if (flights.value.length === 0) return
  
  const size = Math.max(1, Math.floor(batchSize.value) || 10)
  const batches = []
  
  // Split flights into batches
  for (let i = 0; i < flights.value.length; i += size) {
    batches.push(flights.value.slice(i, i + size))
  }
  
  isSubmitting.value = true
  batchProgress.totalBatches = batches.length
  batchProgress.show = true
  batchProgress.type = 'info'
  
  let successCount = 0
  let errorCount = 0
  
  try {
    for (let i = 0; i < batches.length; i++) {
      batchProgress.currentBatch = i + 1
      batchProgress.message = `Sending batch ${i + 1} of ${batches.length} (${batches[i].length} flights)...`
      
      try {
        const response = await invokeLambda(batches[i])
        successCount += batches[i].length
        console.log(`Batch ${i + 1} response:`, response)
        
        // If this is the last batch, show final success message
        if (i === batches.length - 1) {
          if (errorCount === 0) {
            batchProgress.message = `All ${successCount} flights sent successfully!`
            batchProgress.type = 'success'
            showSnackbar(`Successfully sent ${successCount} flights in ${batches.length} batch(es)!`, 'success')
          } else {
            batchProgress.message = `Completed: ${successCount} succeeded, ${errorCount} failed`
            batchProgress.type = 'warning'
            showSnackbar(`Completed with errors: ${successCount} succeeded, ${errorCount} failed`, 'warning')
          }
        }
      } catch (error) {
        errorCount += batches[i].length
        console.error(`Error in batch ${i + 1}:`, error)
        
        // Continue with next batch even if one fails
        if (i === batches.length - 1) {
          if (successCount > 0) {
            batchProgress.message = `Completed with errors: ${successCount} succeeded, ${errorCount} failed`
            batchProgress.type = 'warning'
            showSnackbar(`Some batches failed: ${successCount} succeeded, ${errorCount} failed`, 'warning')
          } else {
            batchProgress.message = `All batches failed. Last error: ${error.response?.data?.message || error.message}`
            batchProgress.type = 'error'
            showSnackbar(
              error.response?.data?.message || 'Error sending flights to Lambda',
              'error'
            )
          }
        }
      }
    }
  } catch (error) {
    batchProgress.message = `Unexpected error: ${error.message}`
    batchProgress.type = 'error'
    showSnackbar('Unexpected error occurred', 'error')
    console.error('Unexpected error:', error)
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

