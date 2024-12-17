const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const doctors = [
    { id: 1, name: "Dr. Smith", specialization: "Cardiologist", availability: ["Monday", "Wednesday", "Friday"], timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] },
    { id: 2, name: "Dr. Johnson", specialization: "Dermatologist", availability: ["Tuesday", "Thursday", "Saturday"], timeSlots: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"] },
    { id: 3, name: "Dr. Williams", specialization: "Pediatrician", availability: ["Monday", "Wednesday", "Friday"], timeSlots: ["8:30 AM", "10:30 AM", "12:30 PM", "2:30 PM"] },
    { id: 4, name: "Dr. Brown", specialization: "Orthopedic", availability: ["Tuesday", "Thursday", "Saturday"], timeSlots: ["9:30 AM", "11:30 AM", "1:30 PM", "3:30 PM"] },
    { id: 5, name: "Dr. Davis", specialization: "Gastroenterologist", availability: ["Monday", "Wednesday", "Friday"], timeSlots: ["8:30 AM", "10:30 AM", "12:30 PM", "2:30 PM"] },
    { id: 6, name: "Dr. Miller", specialization: "Neurologist", availability: ["Tuesday", "Thursday", "Saturday"], timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] },
    { id: 7, name: "Dr. Wilson", specialization: "Psychiatrist", availability: ["Monday", "Wednesday", "Friday"], timeSlots: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"] },
    { id: 8, name: "Dr. Moore", specialization: "Oncologist", availability: ["Tuesday", "Thursday", "Saturday"], timeSlots: ["8:30 AM", "10:30 AM", "12:30 PM", "2:30 PM"] },
    { id: 9, name: "Dr. Taylor", specialization: "General Physician", availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] }
];

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = message;

    messageDiv.appendChild(content);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addOptions(options) {
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';

    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => {
            handleUserInput(option);
            
            optionsContainer.remove();
        };
        optionsContainer.appendChild(button);
    });

    chatBox.appendChild(optionsContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setAppointmentSession(appointment, mode = 'checkAppointment') {
    const appointmentData = {
        id: appointment.id,
        doctor: appointment.doctor,
        day: appointment.day,
        time: appointment.time,
        originalData: JSON.stringify(appointment)
    };
    sessionStorage.setItem('appointmentData', JSON.stringify(appointmentData));
    sessionStorage.setItem('mode', mode);
}

function getAppointmentSession() {
    const data = sessionStorage.getItem('appointmentData');
    return data ? JSON.parse(data) : null;
}

async function processInput(input) {
    input = input.toLowerCase().trim();

    // Handle the three specific button actions
    if (input === "try describing your symptoms again") {
        sessionStorage.setItem('mode', 'symptoms');
        addMessage("Please describe your symptoms:");
        return;
    }

    if (input === "view all doctors") {
        addMessage("Here are all our available doctors:");
        doctors.forEach(doctor => {
            addMessage(`${doctor.name} - ${doctor.specialization}\nAvailable on: ${doctor.availability.join(', ')}`);
        });
        addMessage("Would you like to book an appointment with any of these doctors?");
        addOptions(doctors.map(doctor => `Book with ${doctor.name} (${doctor.specialization})`));
        return;
    }

    if (input === "go back to main menu") {
        sessionStorage.clear();
        addMessage("How can I help you today?");
        addOptions([
            "Describe your symptoms",
            "Book an appointment",
            "View available doctors",
            "Check appointment status",
            "Cancel appointment",
            "Update appointment"
    ]);
        
        return;
    }

    const currentMode = sessionStorage.getItem('mode');
    const selectedDoctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const selectedDay = sessionStorage.getItem('selectedDay');
    const selectedTime = sessionStorage.getItem('selectedTime');

    if (selectedDoctor && !selectedDay && currentMode !== 'updateAppointment' && currentMode !== 'cancelAppointment' && currentMode !== 'checkStatus') {
        const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const inputDay = daysOfWeek.find(day => input.toLowerCase() === day);
        
        if (inputDay && selectedDoctor.availability.includes(inputDay.charAt(0).toUpperCase() + inputDay.slice(1))) {
            sessionStorage.setItem('selectedDay', inputDay);
            addMessage(`Great! Here are the available time slots for ${selectedDoctor.name} on ${inputDay}:`);
            addOptions(selectedDoctor.timeSlots);
            return;
        }
    }

    if (selectedDoctor && selectedDay && !selectedTime) {
        const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM|am|pm)$/;
        if (timeRegex.test(input)) {
            const normalizedTime = input.toUpperCase();
            if (selectedDoctor.timeSlots.includes(normalizedTime)) {
                sessionStorage.setItem('selectedTime', normalizedTime);
                addMessage("Please provide your email to confirm the appointment:");
                return;
            } else {
                addMessage("That time slot is not available. Please select from the following time slots:");
                addOptions(selectedDoctor.timeSlots);
                return;
            }
        }
        
        if (input.toLowerCase() !== 'back' && input.toLowerCase() !== 'cancel') {
            addMessage("Please select a valid time slot from the options below:");
            addOptions(selectedDoctor.timeSlots);
            return;
        }
    }

    if (selectedDoctor && selectedDay && selectedTime && isValidEmail(input)) {
        const appointmentId = Math.random().toString(36).substr(2, 9);
        const appointments = JSON.parse(localStorage.getItem('appointments')) || {};
        
        appointments[appointmentId] = {
            doctor: selectedDoctor.name,
            day: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1),
            time: selectedTime,
            email: input,
            status: 'Confirmed'
        };
        
        localStorage.setItem('appointments', JSON.stringify(appointments));

        fetch('http://localhost:3000/send-appointment-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doctor: selectedDoctor.name,
                day: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1),
                time: selectedTime,
                email: input,
                appointmentId: appointmentId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addMessage(`Appointment Confirmed!
                    Doctor: ${selectedDoctor.name}
                    Day: ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                    Time: ${selectedTime}
                    Email: ${input}
                    Appointment ID: ${appointmentId}

                  ✅  A confirmation email has been sent to your inbox.`);
            } else {
                addMessage(`Appointment Confirmed!
                    Doctor: ${selectedDoctor.name}
                    Day: ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                    Time: ${selectedTime}
                    Email: ${input}
                    Appointment ID: ${appointmentId}
                    
                    ⚠️ Note: There was an issue sending the confirmation email.`);
            }
        })
        .catch(error => {
            console.error('Error sending confirmation email:', error);
            addMessage(`Appointment Confirmed!
                Doctor: ${selectedDoctor.name}
                Day: ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                Time: ${selectedTime}
                Email: ${input}
                Appointment ID: ${appointmentId}
                
                Note: There was an issue sending the confirmation email.`);
        });

        sessionStorage.clear();
        
        setTimeout(() => {
            addMessage("Your appointment is confirmed. We look forward to seeing you!");
        }, 1000);
        
        return;
    } else if (selectedDoctor && selectedDay && selectedTime) {
        addMessage("Invalid email format. Please provide a valid email address:");
        return;
    }

    if (input.includes('book with dr.') || input.includes('book with doctor')) {
        const doctorName = input.replace(/book with (dr\.|doctor)\s*/i, '').trim();
        const doctor = doctors.find(doc => 
            doctorName.toLowerCase().includes(doc.name.toLowerCase())
        );

        if (doctor) {
            sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
            addMessage(`Great! Let's schedule your appointment with ${doctor.name}.`);
            addMessage("Please select your preferred day:");
            addOptions(doctor.availability);
            return;
        }
    }

    if (input.toLowerCase().includes('book') || input.toLowerCase().includes('view doctors')) {
        sessionStorage.setItem('mode', 'selectDoctor');
        addMessage("Please select a doctor to proceed:");
        doctors.forEach(doctor => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = `${doctor.name} (${doctor.specialization})`;
            button.onclick = () => {
                sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
                addMessage(`Great! Let's schedule your appointment with ${doctor.name}.`);
                addMessage("Please select your preferred day:");
                addOptions(doctor.availability);
            };
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';
            optionsContainer.appendChild(button);
            chatBox.appendChild(optionsContainer);
        });
        return;
    }

    if (currentMode === 'symptoms') {
        try {
            const response = await fetch('/analyze_symptoms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symptoms: input })
            });

            if (response.ok) {
                const result = await response.json();
                const recommendation = result.recommendation;
                addMessage(recommendation);

                const matchingDoctors = doctors.filter(doctor =>
                    doctor.specialization.toLowerCase() === result.specialty.toLowerCase()
                );

                if (matchingDoctors.length > 0) {
                    addMessage("Based on your symptoms, here are the recommended specialists:");
                    matchingDoctors.forEach(doctor => {
                        const button = document.createElement('button');
                        button.className = 'option-button';
                        button.textContent = `Book with ${doctor.name} (${doctor.specialization})`;
                        button.onclick = () => {
                            sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
                            addMessage(`Great! Let's schedule your appointment with ${doctor.name}.`);
                            addMessage("Please select your preferred day:");
                            addOptions(doctor.availability);
                        };
                        const optionsContainer = document.createElement('div');
                        optionsContainer.className = 'options-container';
                        optionsContainer.appendChild(button);
                        chatBox.appendChild(optionsContainer);
                    });
                } else {
                    addMessage("I apologize, but we don't have any specialists available for your specific condition at the moment.");
                    addMessage("Would you like to see other available doctors?");
                    addOptions(["View all doctors", "Go back to main menu"]);
                }
            } else {
                addMessage("I'm having trouble analyzing your symptoms. Would you like to:");
                addOptions([
                    "Try describing your symptoms again",
                    "View all doctors",
                    "Go back to main menu"
                ]);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage("I apologize, but I'm having trouble processing your request. Please try again.");
        }
        return;
    }

    if (input.includes('view all doctors') || input.includes('see all doctors')) {
        addMessage("Here are all our available doctors:");
        doctors.forEach(doctor => {
            addMessage(`${doctor.name} - ${doctor.specialization}\nAvailable on: ${doctor.availability.join(', ')}`);
        });
        addMessage("Click on a doctor's name to book an appointment:");
        addOptions(doctors.map(doctor => `${doctor.name} (${doctor.specialization})`));
        return;
    }

    if (input.toLowerCase().includes('check appointment')) {
        addMessage("Please provide your Appointment ID to check the status:");
        sessionStorage.setItem('mode', 'checkStatus');
        return;
    }

    if (currentMode === 'checkStatus') {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || {};
        const appointment = appointments[input];

        if (appointment) {
            addMessage(`Here are your appointment details:
                Doctor: ${appointment.doctor}
                Day: ${appointment.day}
                Time: ${appointment.time}
                Status: ${appointment.status}`);
        } else {
            addMessage("No appointment found with this ID. Please check the ID and try again.");
        }

        sessionStorage.clear();
        setTimeout(() => {
            addMessage("What else can I help you with?");
            addOptions([
                "Describe your symptoms",
                "Book an appointment",
                "View available doctors",
                "Check appointment status",
                "Cancel appointment",
                "Update appointment"
            ]);
        }, 1000);
        return;
    }

    if (input.toLowerCase() === 'cancel appointment') {
        sessionStorage.clear();
        sessionStorage.setItem('mode', 'cancelAppointment');
        addMessage("Please provide your Appointment ID to cancel your appointment:");
        return;
    }

    if (currentMode === 'cancelAppointment') {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || {};
        const appointment = appointments[input];

        if (appointment) {
            delete appointments[input];
            localStorage.setItem('appointments', JSON.stringify(appointments));

            fetch('http://localhost:3000/send-cancellation-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doctor: appointment.doctor,
                    day: appointment.day,
                    time: appointment.time,
                    email: appointment.email,
                    appointmentId: input
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addMessage(`Appointment cancelled successfully!
                        Previous details:
                        Doctor: ${appointment.doctor}
                        Day: ${appointment.day}
                        Time: ${appointment.time}
                        
                       ⚠️ A cancellation confirmation email has been sent to your inbox.`);
                 }
                
            })
            .catch(error => {
                console.error('Error sending cancellation email:', error);
                addMessage(`Appointment cancelled successfully!
                    Previous details:
                    Doctor: ${appointment.doctor}
                    Day: ${appointment.day}
                    Time: ${appointment.time}
                    
                    Note: There was an issue sending the cancellation email.`);
            });
        } else {
            addMessage("No appointment found with this ID. Please check the ID and try again.");
        }

        sessionStorage.clear();
        setTimeout(() => {
            addMessage("What else can I help you with?");
            addOptions([
                "Describe your symptoms",
                "Book an appointment",
                "View available doctors",
                "Check appointment status",
                "Cancel appointment",
                "Update appointment"
            ]);
        }, 1000);
        return;
    }

    if (input.toLowerCase() === 'update appointment') {
        sessionStorage.clear();
        sessionStorage.setItem('mode', 'updateAppointment');
        addMessage("Please provide your Appointment ID to update your appointment:");
        return;
    }

    if (currentMode === 'updateAppointment') {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || {};
        const appointment = appointments[input];

        if (appointment) {
            const doctor = doctors.find(d => d.name === appointment.doctor);
            if (!doctor) {
                addMessage("Error: Doctor not found. Please try again later.");
                sessionStorage.clear();
                return;
            }

            sessionStorage.setItem('appointmentToUpdate', input);
            sessionStorage.setItem('mode', 'selectUpdateOption');
            addMessage(`Current appointment details:
                Doctor: ${appointment.doctor}
                Day: ${appointment.day}
                Time: ${appointment.time}
                
                What would you like to update?`);
            addOptions([
                "Update day",
                "Update time",
                "Cancel update"
            ]);
        } else {
            addMessage("No appointment found with this ID. Please check the ID and try again.");
            sessionStorage.clear();
            setTimeout(() => {
                addMessage("What else can I help you with?");
                addOptions([
                    "Describe your symptoms",
                    "Book an appointment",
                    "View available doctors",
                    "Check appointment status",
                    "Cancel appointment",
                    "Update appointment"
                ]);
            }, 1000);
        }
        return;
    }

    if (currentMode === 'selectUpdateOption') {
        const appointmentId = sessionStorage.getItem('appointmentToUpdate');
        const appointments = JSON.parse(localStorage.getItem('appointments'));
        const appointment = appointments[appointmentId];
        const doctor = doctors.find(d => d.name === appointment.doctor);

        if (input.toLowerCase() === 'update day') {
            sessionStorage.setItem('mode', 'updateDay');
            addMessage("Please select a new day:");
            addOptions(doctor.availability);
            return;
        } else if (input.toLowerCase() === 'update time') {
            sessionStorage.setItem('mode', 'updateTime');
            addMessage("Please select a new time:");
            addOptions(doctor.timeSlots);
            return;
        } else if (input.toLowerCase() === 'cancel update') {
            sessionStorage.clear();
            addMessage("Update cancelled. What else can I help you with?");
            addOptions([
                "Describe your symptoms",
                "Book an appointment",
                "View available doctors",
                "Check appointment status",
                "Cancel appointment",
                "Update appointment"
            ]);
            return;
        }
    }

    if (currentMode === 'updateDay') {
        const appointmentId = sessionStorage.getItem('appointmentToUpdate');
        const appointments = JSON.parse(localStorage.getItem('appointments'));
        const appointment = appointments[appointmentId];
        const doctor = doctors.find(d => d.name === appointment.doctor);
        
        const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const inputDay = daysOfWeek.find(day => input.toLowerCase() === day);
        
        if (inputDay && doctor.availability.includes(inputDay.charAt(0).toUpperCase() + inputDay.slice(1))) {
            const oldDay = appointment.day;
            appointment.day = inputDay.charAt(0).toUpperCase() + inputDay.slice(1);
            appointments[appointmentId] = appointment;
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            fetch('http://localhost:3000/send-update-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doctor: appointment.doctor,
                    day: appointment.day,
                    time: appointment.time,
                    email: appointment.email,
                    appointmentId: appointmentId,
                    oldDay: oldDay
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addMessage(`Appointment updated successfully!
                        New details:
                        Doctor: ${appointment.doctor}
                        Day: ${appointment.day}
                        Time: ${appointment.time}
                        
                        An update confirmation email has been sent to your inbox.`);
                } else {
                    addMessage(`Appointment updated successfully!
                        New details:
                        Doctor: ${appointment.doctor}
                        Day: ${appointment.day}
                        Time: ${appointment.time}
                        
                        Note: There was an issue sending the update email.`);
                }
            })
            .catch(error => {
                console.error('Error sending update email:', error);
                addMessage(`Appointment updated successfully!
                    New details:
                    Doctor: ${appointment.doctor}
                    Day: ${appointment.day}
                    Time: ${appointment.time}
                    
                    Note: There was an issue sending the update email.`);
            });

            sessionStorage.clear();
            setTimeout(() => {
                addMessage("Your appointment is updated. We look forward to seeing you!");
            }, 1000);
            return;
        } else {
            addMessage("Please select a valid day from the options below:");
            addOptions(doctor.availability);
            return;
        }
    }

    if (currentMode === 'updateTime') {
        const appointmentId = sessionStorage.getItem('appointmentToUpdate');
        const appointments = JSON.parse(localStorage.getItem('appointments'));
        const appointment = appointments[appointmentId];
        const doctor = doctors.find(d => d.name === appointment.doctor);

        const lowercaseTimeSlots = doctor.timeSlots.map(slot => slot.toLowerCase());
        const lowercaseInput = input.toLowerCase().trim();

        if (lowercaseTimeSlots.includes(lowercaseInput)) {
            const oldTime = appointment.time;
            appointment.time = input;
            appointments[appointmentId] = appointment;
            localStorage.setItem('appointments', JSON.stringify(appointments));
            
            fetch('http://localhost:3000/send-appointment-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doctor: appointment.doctor,
                    day: appointment.day,
                    time: appointment.time,
                    email: appointment.email,
                    appointmentId: appointmentId,
                    type: 'update',
                    oldTime: oldTime
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addMessage(`Appointment updated successfully!
                        New details:
                        Doctor: ${appointment.doctor}
                        Day: ${appointment.day}
                        Time: ${appointment.time}
                        
                        An update confirmation email has been sent to your inbox.`);
                } else {
                    addMessage(`Appointment updated successfully!
                        New details:
                        Doctor: ${appointment.doctor}
                        Day: ${appointment.day}
                        Time: ${appointment.time}
                        
                        Note: There was an issue sending the update email.`);
                }
            })
            .catch(error => {
                console.error('Error sending update email:', error);
                addMessage(`Appointment updated successfully!
                    New details:
                    Doctor: ${appointment.doctor}
                    Day: ${appointment.day}
                    Time: ${appointment.time}
                    
                    Note: There was an issue sending the update email.`);
            });
            
            sessionStorage.clear();
            setTimeout(() => {
                addMessage("Your appointment is updated. We look forward to seeing you!");
            }, 1000);
            return;
        } else {
            addMessage("Please select a valid time from the options below:");
            addOptions(doctor.timeSlots);
            return;
        }
    }

    function handleConfirmUpdate(input) {
        const appointmentData = getAppointmentSession();
        
        if (!appointmentData) {
            addMessage("Session expired. Please try again.");
            resetToMainMenu();
            return;
        }

        if (input.toLowerCase().includes('yes')) {
            const doctor = doctors.find(doc => doc.name === appointmentData.doctor);
    
            if (doctor) {
                const updatedAppointmentData = {
                    ...appointmentData,
                    availableTimeSlots: doctor.timeSlots
                };
                setAppointmentSession(updatedAppointmentData, 'selectTime');
    
                addMessage(`Please select a new time slot for your appointment with ${doctor.name} on ${appointmentData.day}:`);
                addOptions(doctor.timeSlots);
            } else {
                addMessage("Error finding the doctor's details. Please try again or contact support.");
                resetToMainMenu();
            }
        } else if (input.toLowerCase().includes('no') || input.toLowerCase().includes('back')) {
            addMessage("Returning to the main menu. What would you like to do?");
            resetToMainMenu();
        }
    }
    
    function handleSelectTime(input) {
        const appointmentData = getAppointmentSession();
        
        if (!appointmentData || !appointmentData.availableTimeSlots) {
            addMessage("Session expired. Please try again.");
            resetToMainMenu();
            return;
        }

        const newTime = input.trim();
    
        if (!appointmentData.availableTimeSlots.includes(newTime)) {
            addMessage("Invalid time slot. Please select a valid time slot from the options below:");
            addOptions(appointmentData.availableTimeSlots);
            return;
        }
    
        const appointments = JSON.parse(localStorage.getItem('appointments')) || {};
        appointments[appointmentData.id] = {
            ...appointments[appointmentData.id],
            time: newTime
        };
        localStorage.setItem('appointments', JSON.stringify(appointments));
    
        addMessage(`Appointment updated successfully!
            Doctor: ${appointmentData.doctor}
            Day: ${appointmentData.day}
            Time: ${newTime}`);
    
        sessionStorage.clear();
        setTimeout(() => {
            addMessage("Your appointment is updated. We look forward to seeing you!");
        }, 1000);
    }
    
    function resetToMainMenu() {
        sessionStorage.clear();
        addOptions([
            "Describe your symptoms",
            "Book an appointment",
            "View available doctors",
            "Check appointment status",
            "Cancel appointment",
            "Update appointment"
        ]);
    }

    if (input.includes('symptoms') || input.includes('problem') || input.includes('feeling')) {
        sessionStorage.setItem('mode', 'symptoms');
        addMessage("Please describe your symptoms in detail:");
        return;
    }

    if (input.includes('status')) {
        sessionStorage.setItem('mode', 'status');
        addMessage("Please enter your appointment ID to check the status:");
        return;
    }

    if (input.includes('cancel')) {
        sessionStorage.setItem('mode', 'cancel');
        addMessage("Please enter your appointment ID to cancel your appointment:");
        return;
    }

    if (input.includes('update')) {
        sessionStorage.setItem('mode', 'checkAppointment');
        addMessage("Please enter your appointment ID to check and update the appointment:");
        return;
    }

    if (input.includes('book') || input.includes('appointment')) {
        sessionStorage.setItem('mode', 'booking');
        addMessage("Please select a doctor:");
        const doctorOptions = doctors.map(doctor => `${doctor.name} (${doctor.specialization})`);
        addOptions(doctorOptions);
        return;
    }

    if (input.includes('doctor') || input.includes('doctors')) {
        addMessage("Available Doctors:");
        doctors.forEach(doctor => {
            addMessage(`${doctor.name} - ${doctor.specialization}\nAvailable on: ${doctor.availability.join(', ')}`);
        });
        addMessage("Click on a doctor's name to book an appointment:");
        addOptions(doctors.map(doctor => `${doctor.name} (${doctor.specialization})`));
        return;
    }

    addMessage("How can I help you? Choose an option:");
    addOptions([
        "Describe your symptoms",
        "Book an appointment",
        "View available doctors",
        "Check appointment status",
        "Cancel appointment",
        "Update appointment"
    ]);
}

function handleUserInput(input) {
    if (!input.trim()) return;

    addMessage(input, true);
    userInput.value = '';

    processInput(input);
}

sendBtn.addEventListener('click', () => {
    handleUserInput(userInput.value);
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput(userInput.value);
    }
});

window.onload = async () => {
    sessionStorage.clear();
    
    const initialMessages = [
        "Hello! I'm MedBot, your medical assistant. How can I help you today?",
    ];
    
    initialMessages.forEach(msg => addMessage(msg));
    addOptions([
        "Describe your symptoms",
        "Book an appointment",
        "View available doctors",
        "Check appointment status",
        "Cancel appointment",
        "Update appointment"
    ]);
};
