// State management
let currentWeekStart = null;
let availabilityData = null;
let selectedSlot = null;

// Time slot configuration - Only show these specific times
const AVAILABLE_TIMES = {
    morning: ['10:30', '11:00', '11:30', '12:00', '12:30'], // 30-min blocks
    afternoon: ['14:00', '15:00', '16:00', '17:00', '18:00'] // 1-hour blocks
};

const ALL_TIMES = [...AVAILABLE_TIMES.morning, ...AVAILABLE_TIMES.afternoon];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeWeek();
    loadAvailability();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    document.getElementById('prevWeek').addEventListener('click', () => {
        changeWeek(-1);
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        changeWeek(1);
    });

    // Booking modal
    const bookingModal = document.getElementById('bookingModal');
    const closeBooking = bookingModal.querySelector('.close');
    const cancelBooking = document.getElementById('cancelBooking');
    const bookingForm = document.getElementById('bookingForm');

    closeBooking.addEventListener('click', () => {
        bookingModal.style.display = 'none';
        selectedSlot = null;
    });

    cancelBooking.addEventListener('click', () => {
        bookingModal.style.display = 'none';
        selectedSlot = null;
    });

    bookingForm.addEventListener('submit', handleBooking);

    // Cancel modal
    const cancelModal = document.getElementById('cancelModal');
    const closeCancelModal = cancelModal.querySelector('.close');
    const cancelCancelBooking = document.getElementById('cancelCancelBooking');
    const confirmCancelBooking = document.getElementById('confirmCancelBooking');

    closeCancelModal.addEventListener('click', () => {
        cancelModal.style.display = 'none';
        selectedSlot = null;
    });

    cancelCancelBooking.addEventListener('click', () => {
        cancelModal.style.display = 'none';
        selectedSlot = null;
    });

    confirmCancelBooking.addEventListener('click', handleCancelBooking);

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === bookingModal) {
            bookingModal.style.display = 'none';
            selectedSlot = null;
        }
        if (event.target === cancelModal) {
            cancelModal.style.display = 'none';
            selectedSlot = null;
        }
    });
}

// Initialize the current week
function initializeWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    currentWeekStart = monday;
    updateWeekDisplay();
}

// Change week
function changeWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    updateWeekDisplay();
    renderCalendar();
}

// Update week display
function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 4); // Friday

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startStr = currentWeekStart.toLocaleDateString('es-CL', options);
    const endStr = weekEnd.toLocaleDateString('es-CL', options);

    document.getElementById('weekDisplay').textContent = `${startStr} - ${endStr}`;
}

// Load availability data from server
async function loadAvailability() {
    try {
        const response = await fetch('/api/availability');
        if (!response.ok) {
            throw new Error('Failed to load availability');
        }
        availabilityData = await response.json();
        renderCalendar();
    } catch (error) {
        console.error('Error loading availability:', error);
        showNotification('Failed to load availability data', 'error');
    }
}

// Render calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Generate 5 days (Monday to Friday)
    for (let i = 0; i < 5; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);

        const dayColumn = createDayColumn(date);
        calendar.appendChild(dayColumn);
    }
}

// Create a day column
function createDayColumn(date) {
    const dayColumn = document.createElement('div');
    dayColumn.className = 'day-column';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    const dayName = document.createElement('span');
    dayName.className = 'day-name';
    dayName.textContent = date.toLocaleDateString('es-CL', { weekday: 'long' });

    const dayDate = document.createElement('span');
    dayDate.className = 'day-date';
    dayDate.textContent = date.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });

    dayHeader.appendChild(dayName);
    dayHeader.appendChild(dayDate);
    dayColumn.appendChild(dayHeader);

    const timeSlots = document.createElement('div');
    timeSlots.className = 'time-slots';

    const dateStr = formatDate(date);
    const isPast = date < new Date().setHours(0, 0, 0, 0);

    // Only render the specified time slots
    ALL_TIMES.forEach(time => {
        if (!isPast) {
            const slot = createTimeSlot(dateStr, time);
            timeSlots.appendChild(slot);
        }
    });

    if (isPast) {
        const pastMsg = document.createElement('div');
        pastMsg.style.textAlign = 'center';
        pastMsg.style.color = 'var(--text-secondary)';
        pastMsg.style.fontSize = '14px';
        pastMsg.style.padding = '20px 10px';
        pastMsg.textContent = 'Past dates';
        timeSlots.appendChild(pastMsg);
    }

    dayColumn.appendChild(timeSlots);
    return dayColumn;
}

// Create a time slot element
function createTimeSlot(date, time) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'time-slot';

    // Find if this slot is booked
    const bookedSlot = availabilityData?.slots.find(
        s => s.date === date && s.time === time && s.booked
    );

    if (bookedSlot) {
        slotDiv.classList.add('booked');
        slotDiv.innerHTML = `
            ${time}
            <span class="slot-client">${sanitizeHTML(bookedSlot.clientName)}</span>
        `;
        slotDiv.addEventListener('click', () => showCancelModal(date, time, bookedSlot.clientName));
    } else {
        slotDiv.classList.add('available');
        slotDiv.textContent = time;
        slotDiv.addEventListener('click', () => showBookingModal(date, time));
    }

    return slotDiv;
}

// Show booking modal
function showBookingModal(date, time) {
    selectedSlot = { date, time };

    const modal = document.getElementById('bookingModal');
    const slotInfo = document.getElementById('modalSlotInfo');

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    slotInfo.innerHTML = `<strong>Date:</strong> ${dateStr}<br><strong>Time:</strong> ${time}`;

    // Reset form
    document.getElementById('bookingForm').reset();

    modal.style.display = 'block';
}

// Show cancel modal
function showCancelModal(date, time, clientName) {
    selectedSlot = { date, time, clientName };

    const modal = document.getElementById('cancelModal');
    const slotInfo = document.getElementById('cancelModalInfo');

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    slotInfo.innerHTML = `
        <strong>Date:</strong> ${dateStr}<br>
        <strong>Time:</strong> ${time}<br>
        <strong>Booked by:</strong> ${sanitizeHTML(clientName)}
    `;

    modal.style.display = 'block';
}

// Handle booking submission
async function handleBooking(event) {
    event.preventDefault();

    if (!selectedSlot) return;

    const clientName = document.getElementById('clientName').value.trim();

    if (!clientName || clientName.length < 2) {
        showNotification('Please enter a valid name (at least 2 characters)', 'error');
        return;
    }

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedSlot.date,
                time: selectedSlot.time,
                clientName: clientName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to book slot');
        }

        showNotification('Time slot booked successfully!', 'success');

        // Close modal and reload data
        document.getElementById('bookingModal').style.display = 'none';
        selectedSlot = null;
        await loadAvailability();

    } catch (error) {
        console.error('Error booking slot:', error);
        showNotification(error.message || 'Failed to book time slot', 'error');
    }
}

// Handle cancel booking
async function handleCancelBooking() {
    if (!selectedSlot) return;

    try {
        const response = await fetch('/api/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedSlot.date,
                time: selectedSlot.time
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to cancel booking');
        }

        showNotification('Booking cancelled successfully', 'success');

        // Close modal and reload data
        document.getElementById('cancelModal').style.display = 'none';
        selectedSlot = null;
        await loadAvailability();

    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification(error.message || 'Failed to cancel booking', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: '2000',
        maxWidth: '400px',
        fontSize: '14px',
        fontWeight: '500',
        animation: 'slideIn 0.3s ease-out'
    });

    if (type === 'success') {
        notification.style.backgroundColor = '#10B981';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#EF4444';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#3B82F6';
        notification.style.color = 'white';
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
