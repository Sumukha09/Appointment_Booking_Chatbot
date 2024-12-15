// Google Calendar Integration

function createGoogleCalendarLink(eventDetails) {
    const {
        title = 'Doctor Appointment',
        startDate,
        endDate,
        description = 'Medical appointment scheduled through chatbot',
        location = ''
    } = eventDetails;

    // Format dates for Google Calendar URL
    const formatDate = (date) => {
        return date.replace(/[-:]/g, '').replace('.000', 'Z');
    };

    // Create the Google Calendar URL
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: encodeURIComponent(title),
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: encodeURIComponent(description),
        location: encodeURIComponent(location)
    });

    return `${baseUrl}?${params.toString()}`;
}

// Function to convert 12-hour format to 24-hour format
function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier.toLowerCase() === 'pm') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours.padStart(2, '0')}:${minutes}`;
}

// Function to get next occurrence of a day
function getNextDayOccurrence(dayName) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const targetDay = days.indexOf(dayName.toLowerCase());
    const todayDay = today.getDay();
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate.toISOString().split('T')[0];
}

// Function to generate calendar link for appointment
function generateAppointmentLink(day, time, doctorName) {
    // Get the next occurrence of the selected day
    const appointmentDate = getNextDayOccurrence(day);
    
    // Convert time to 24-hour format
    const time24h = convertTo24Hour(time);
    
    // Combine date and time
    const startDateTime = `${appointmentDate}T${time24h}:00`;
    
    // Set appointment duration to 1 hour
    const endDate = new Date(startDateTime);
    endDate.setHours(endDate.getHours() + 1);
    const endDateTime = endDate.toISOString();

    const eventDetails = {
        title: `Doctor Appointment with ${doctorName}`,
        startDate: startDateTime,
        endDate: endDateTime,
        description: `Medical appointment with ${doctorName}`
    };

    return createGoogleCalendarLink(eventDetails);
}

// Function to add calendar link to appointment confirmation
function addCalendarLinkToConfirmation(doctor, day, time) {
    const calendarLink = generateAppointmentLink(day, time, doctor);
    const message = `Add to Google Calendar: <a href="${calendarLink}" target="_blank">Click here</a>`;
    addMessage(message);
}
