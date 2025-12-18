<template>
  <v-container>
    <!-- Batch Management Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>
              <v-icon icon="mdi-folder-multiple" class="mr-2"></v-icon>
              Flight Batches
            </span>
            <v-btn
              color="primary"
              @click="createNewBatch"
              prepend-icon="mdi-plus"
            >
              New Batch
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-select
              v-model="currentBatchId"
              :items="batchOptions"
              label="Select Batch"
              item-title="title"
              item-value="id"
              return-object
              @update:model-value="onBatchChange"
              hint="Select a batch to add flights to"
              persistent-hint
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-folder" class="mr-2"></v-icon>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ batches[item.raw.id]?.flights?.length || 0 }} flights
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      @click.stop="deleteBatch(item.raw.id)"
                      :disabled="batches[item.raw.id]?.flights?.length > 0"
                    ></v-btn>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <v-alert
              v-if="currentBatch"
              type="info"
              variant="tonal"
              class="mt-3"
            >
              <div class="d-flex align-center justify-space-between">
                <span>
                  <strong>{{ currentBatch.title }}</strong>
                  <span class="ml-2">({{ currentBatch.flights.length }} flights)</span>
                </span>
                <v-chip size="small" color="primary">
                  Active Batch
                </v-chip>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-plus-circle" class="mr-2"></v-icon>
            Build Flights
            <v-chip v-if="currentBatch" size="small" color="primary" class="ml-2">
              Adding to: {{ currentBatch.title }}
            </v-chip>
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
                  :disabled="!valid || !currentBatch"
                  @click="addFlight"
                  class="mr-2"
                >
                <v-icon icon="mdi-plus" class="mr-1"></v-icon>
                Add Flight to Batch
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
    
    <v-row v-if="currentBatch && currentBatch.flights.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>
              <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
              {{ currentBatch.title }} - Flights ({{ currentBatch.flights.length }})
            </span>
            <div class="d-flex align-center" style="gap: 8px;">
              <v-text-field
                v-model.number="batchSize"
                label="Batch Size"
                type="number"
                min="1"
                :max="currentBatch.flights.length"
                density="compact"
                style="max-width: 120px;"
                hint="Flights per batch"
                persistent-hint
                :disabled="isSubmitting"
              ></v-text-field>
              <v-btn
                color="success"
                :disabled="currentBatch.flights.length === 0 || isSubmitting"
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

    <!-- Dialog for creating new batch -->
    <v-dialog v-model="newBatchDialog" max-width="500">
      <v-card>
        <v-card-title>
          <span class="text-h5">Create New Batch</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newBatchName"
            label="Batch Name"
            :rules="[rules.required, rules.batchName]"
            hint="Enter a name for this batch"
            persistent-hint
            autofocus
            @keyup.enter="confirmCreateBatch"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="newBatchDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!newBatchName || !isValidBatchName(newBatchName)"
            @click="confirmCreateBatch"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { invokeLambda } from '../services/api'

const form = ref(null)
const valid = ref(false)
const isSubmitting = ref(false)
const batchSize = ref(10)
const currentBatchId = ref(null)
const batches = ref({})
const newBatchDialog = ref(false)
const newBatchName = ref('')

// Computed properties
const currentBatch = computed(() => {
  if (!currentBatchId.value) return null
  return batches.value[currentBatchId.value] || null
})

const batchOptions = computed(() => {
  return Object.values(batches.value).map(batch => ({
    id: batch.id,
    title: batch.title
  }))
})

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
  },
  batchName: value => {
    if (!value) return true
    return value.trim().length > 0 || 'Batch name cannot be empty'
  }
}

// Batch management functions
const generateBatchId = () => {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const createNewBatch = () => {
  newBatchName.value = ''
  newBatchDialog.value = true
}

const confirmCreateBatch = () => {
  if (!isValidBatchName(newBatchName.value)) return
  
  const batchId = generateBatchId()
  const batch = {
    id: batchId,
    title: newBatchName.value.trim(),
    flights: [],
    createdAt: new Date().toISOString()
  }
  
  batches.value[batchId] = batch
  currentBatchId.value = batchId
  newBatchDialog.value = false
  newBatchName.value = ''
  
  // Save to localStorage
  saveBatchesToStorage()
  
  showSnackbar(`Batch "${batch.title}" created!`, 'success')
}

const isValidBatchName = (name) => {
  return name && name.trim().length > 0
}

const onBatchChange = (batch) => {
  if (batch && batch.id) {
    currentBatchId.value = batch.id
    saveBatchesToStorage()
  }
}

const deleteBatch = (batchId) => {
  if (!batches.value[batchId]) return
  
  const batch = batches.value[batchId]
  if (batch.flights.length > 0) {
    showSnackbar('Cannot delete batch with flights. Remove flights first.', 'warning')
    return
  }
  
  delete batches.value[batchId]
  
  // If deleted batch was current, select another or clear
  if (currentBatchId.value === batchId) {
    const remainingBatches = Object.values(batches.value)
    currentBatchId.value = remainingBatches.length > 0 ? remainingBatches[0].id : null
  }
  
  saveBatchesToStorage()
  showSnackbar(`Batch "${batch.title}" deleted`, 'info')
}

// LocalStorage persistence
const saveBatchesToStorage = () => {
  try {
    localStorage.setItem('flightBatches', JSON.stringify(batches.value))
    localStorage.setItem('currentBatchId', currentBatchId.value)
  } catch (error) {
    console.error('Error saving batches to localStorage:', error)
  }
}

const loadBatchesFromStorage = () => {
  try {
    const saved = localStorage.getItem('flightBatches')
    const savedCurrentId = localStorage.getItem('currentBatchId')
    
    if (saved) {
      batches.value = JSON.parse(saved)
    }
    
    if (savedCurrentId && batches.value[savedCurrentId]) {
      currentBatchId.value = savedCurrentId
    } else if (Object.keys(batches.value).length > 0) {
      // Select first batch if current doesn't exist
      currentBatchId.value = Object.values(batches.value)[0].id
    }
  } catch (error) {
    console.error('Error loading batches from localStorage:', error)
  }
}

// Initialize with default batch if none exist
onMounted(() => {
  loadBatchesFromStorage()
  
  // Create default batch if none exist
  if (Object.keys(batches.value).length === 0) {
    const defaultBatch = {
      id: generateBatchId(),
      title: 'Default Batch',
      flights: [],
      createdAt: new Date().toISOString()
    }
    batches.value[defaultBatch.id] = defaultBatch
    currentBatchId.value = defaultBatch.id
    saveBatchesToStorage()
  }
})

const addDestAlt = () => {
  flight.destAltApts.push({ apt: '' })
}

const removeDestAlt = (index) => {
  flight.destAltApts.splice(index, 1)
}

const addFlight = async () => {
  if (!currentBatch.value) {
    showSnackbar('Please select or create a batch first', 'warning')
    return
  }
  
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
  
  currentBatch.value.flights.push({ ...flightData })
  saveBatchesToStorage()
  resetForm()
  showSnackbar(`Flight added to "${currentBatch.value.title}"!`, 'success')
}

const removeFlight = (index) => {
  if (!currentBatch.value) return
  currentBatch.value.flights.splice(index, 1)
  saveBatchesToStorage()
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
  if (!currentBatch.value || currentBatch.value.flights.length === 0) return
  
  const flightsToSubmit = currentBatch.value.flights
  const size = Math.max(1, Math.floor(batchSize.value) || 10)
  const batches = []
  
  // Split flights into batches
  for (let i = 0; i < flightsToSubmit.length; i += size) {
    batches.push(flightsToSubmit.slice(i, i + size))
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

