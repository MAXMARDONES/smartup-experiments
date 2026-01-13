// Configuration
const API_BASE = '/api';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00'
];

// State
let availabilityData = null;
let currentDeveloper = null;

// DOM Elements
const developerSelect = document.getElementById('developer');
const calendarDiv = document.getElementById('calendar');
const saveButton = document.getElementById('saveChanges');
const addDeveloperButton = document.getElementById('addDeveloper');
const statusDiv = document.getElementById('status');

// Initialize app
async function init() {
    try {
        await loadAvailabilityData();
        renderDeveloperSelect();
        renderCalendar();
        setupEventListeners();
    } catch (error) {
        showStatus('Failed to initialize app: ' + error.message, 'error');
    }
}

// Load data from server
async function loadAvailabilityData() {
    const response = await fetch(`${API_BASE}/availability`);
    if (!response.ok) throw new Error('Failed to load availability data');
    availabilityData = await response.json();
}

// Render developer dropdown
function renderDeveloperSelect() {
    developerSelect.innerHTML = '<option value="">Select developer...</option>';
    
    availabilityData.developers.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev.id;
        option.textContent = dev.name;
        developerSelect.appendChild(option);
    });
    
    // Auto-select first developer
    if (availabilityData.developers.length > 0) {
        developerSelect.value = availabilityData.developers[0].id;
        currentDeveloper = availabilityData.developers[0];
    }
}

// Render calendar grid
function renderCalendar() {
    if (!currentDeveloper) {
        calendarDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Please select a developer to view availability</p>';
        return;
    }
    
    calendarDiv.innerHTML = '';
    
    DAYS.forEach((day, index) => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        dayColumn.appendChild(header);
        
        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'time-slots';
        
        TIME_SLOTS.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            slot.dataset.day = index + 1; // 1-7 (Monday-Sunday)
            slot.dataset.time = time;
            
            // Check if this slot is available
            if (isSlotAvailable(index + 1, time)) {
                slot.classList.add('available');
            }
            
            slot.addEventListener('click', () => toggleSlot(slot));
            slotsDiv.appendChild(slot);
        });
        
        dayColumn.appendChild(slotsDiv);
        calendarDiv.appendChild(dayColumn);
    });
}

// Check if a time slot is available
function isSlotAvailable(dayOfWeek, time) {
    if (!currentDeveloper || !currentDeveloper.availability) return false;
    
    const dayAvailability = currentDeveloper.availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayAvailability || !dayAvailability.slots) return false;
    
    const timeMinutes = timeToMinutes(time);
    
    return dayAvailability.slots.some(slot => {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);
        return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    });
}

// Convert time string to minutes since midnight
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convert minutes to time string
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Toggle time slot availability
function toggleSlot(slotElement) {
    slotElement.classList.toggle('available');
}

// Save changes to server
async function saveChanges() {
    try {
        // Collect current state from UI
        const slots = document.querySelectorAll('.time-slot');
        const newAvailability = {};
        
        slots.forEach(slot => {
            const day = parseInt(slot.dataset.day);
            const time = slot.dataset.time;
            const isAvailable = slot.classList.contains('available');
            
            if (!newAvailability[day]) {
                newAvailability[day] = [];
            }
            
            if (isAvailable) {
                newAvailability[day].push(time);
            }
        });
        
        // Convert to slot format (start/end ranges)
        const formattedAvailability = Object.entries(newAvailability).map(([day, times]) => {
            const slots = [];
            times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
            
            let rangeStart = null;
            let rangeEnd = null;
            
            times.forEach((time, index) => {
                const currentMinutes = timeToMinutes(time);
                
                if (rangeStart === null) {
                    rangeStart = currentMinutes;
                    rangeEnd = currentMinutes + 30;
                } else if (currentMinutes === rangeEnd) {
                    rangeEnd = currentMinutes + 30;
                } else {
                    slots.push({
                        start: minutesToTime(rangeStart),
                        end: minutesToTime(rangeEnd)
                    });
                    rangeStart = currentMinutes;
                    rangeEnd = currentMinutes + 30;
                }
                
                // Add last range
                if (index === times.length - 1) {
                    slots.push({
                        start: minutesToTime(rangeStart),
                        end: minutesToTime(rangeEnd)
                    });
                }
            });
            
            return {
                dayOfWeek: parseInt(day),
                slots: slots
            };
        });
        
        // Update current developer's availability
        currentDeveloper.availability = formattedAvailability;
        
        // Save to server
        const response = await fetch(`${API_BASE}/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(availabilityData)
        });
        
        if (!response.ok) throw new Error('Failed to save changes');
        
        showStatus('Changes saved successfully!', 'success');
    } catch (error) {
        showStatus('Failed to save changes: ' + error.message, 'error');
    }
}

// Add new developer
function addDeveloper() {
    const name = prompt('Enter developer name:');
    if (!name || !name.trim()) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if developer already exists
    if (availabilityData.developers.find(dev => dev.id === id)) {
        showStatus('Developer already exists!', 'error');
        return;
    }
    
    // Add new developer
    availabilityData.developers.push({
        id: id,
        name: name.trim(),
        availability: []
    });
    
    renderDeveloperSelect();
    developerSelect.value = id;
    currentDeveloper = availabilityData.developers.find(dev => dev.id === id);
    renderCalendar();
    
    showStatus(`Developer "${name}" added successfully!`, 'success');
}

// Show status message
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    developerSelect.addEventListener('change', (e) => {
        currentDeveloper = availabilityData.developers.find(dev => dev.id === e.target.value);
        renderCalendar();
    });
    
    saveButton.addEventListener('click', saveChanges);
    addDeveloperButton.addEventListener('click', addDeveloper);
}

// Start the app
init();