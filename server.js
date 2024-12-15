const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Create a transporter using Gmail with secure settings
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Helper function to send emails
async function sendEmail(options) {
    try {
        const info = await transporter.sendMail(options);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Endpoint to send appointment confirmation email
app.post('/send-appointment-email', async (req, res) => {
    const { doctor, day, time, email, appointmentId } = req.body;

    // Generate Google Calendar link
    const getNextDayOccurrence = (dayName) => {
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
    };

    const convertTo24Hour = (time12h) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
    
        hours = parseInt(hours);
        if (hours === 12) {
            hours = modifier.toLowerCase() === 'pm' ? 12 : 0;
        } else if (modifier.toLowerCase() === 'pm') {
            hours += 12;
        }
    
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const appointmentDate = getNextDayOccurrence(day);
    const time24h = convertTo24Hour(time);
    
    // Create start and end times in local timezone
    const startDateTime = new Date(`${appointmentDate}T${time24h}:00+05:30`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);

    // Format dates for Google Calendar
    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}${month}${day}T${hours}${minutes}00`;
    };

    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Doctor Appointment with ${doctor}`)}&dates=${formatDate(startDateTime)}/${formatDate(endDateTime)}&details=${encodeURIComponent(`Medical appointment with ${doctor}`)}`;

    const mailOptions = {
        from: {
            name: 'Medical Referral System',
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Appointment Confirmation',
        html: `
            <h2>Appointment Confirmation</h2>
            
            <p>Your appointment has been confirmed with the following details:</p>
            <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Doctor:</strong> ${doctor}</li>
                <li><strong>Day:</strong> ${day}</li>
                <li><strong>Time:</strong> ${time}</li>
                <li><strong>Appointment ID:</strong> ${appointmentId}</li>
            </ul>
            <p>Please save your appointment ID for future reference.</p>
            <p><a href="${calendarLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Add to Google Calendar</a></p>
            <p>If you need to reschedule or cancel your appointment, please use our chat interface.</p>
            <br>
            <p>Best regards,</p>
            <p>Medical Referral System Team</p>
        `
    };

    try {
        const result = await sendEmail(mailOptions);
        res.json({ 
            success: true, 
            message: 'Appointment confirmation email sent successfully', 
            messageId: result.messageId,
            calendarLink: calendarLink  
        });
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            code: error.code,
            response: error.response,
            responseCode: error.responseCode
        });
        res.status(500).json({ success: false, message: 'Failed to send confirmation email', error: error.message });
    }
});

// Endpoint to send appointment cancellation email
app.post('/send-cancellation-email', async (req, res) => {
    const { doctor, day, time, email, appointmentId } = req.body;

    const mailOptions = {
        from: {
            name: 'Medical Referral System',
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Appointment Cancellation Confirmation',
        html: `
            <h2>Appointment Cancellation Confirmation</h2>
            <p>Dear Patient,</p>
            <p>The following appointment has been cancelled:</p>
            <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Doctor:</strong> ${doctor}</li>
                <li><strong>Day:</strong> ${day}</li>
                <li><strong>Time:</strong> ${time}</li>
                <li><strong>Appointment ID:</strong> ${appointmentId}</li>
            </ul>
            <p>If you wish to schedule a new appointment, please visit our chat interface.</p>
            <br>
            <p>Best regards,</p>
            <p>Medical Referral System Team</p>
        `
    };

    try {
        const result = await sendEmail(mailOptions);
        console.log('Cancellation email sent successfully:', result);
        res.json({ success: true, message: 'Cancellation confirmation email sent successfully', messageId: result.messageId });
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        console.error('Error details:', {
            code: error.code,
            response: error.response,
            responseCode: error.responseCode
        });
        res.status(500).json({ success: false, message: 'Failed to send cancellation email', error: error.message });
    }
});

// Endpoint to send appointment update email
app.post('/send-update-email', async (req, res) => {
    const { doctor, day, time, email, appointmentId, oldDay, oldTime } = req.body;

    const mailOptions = {
        from: {
            name: 'Medical Referral System',
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Appointment Update Confirmation',
        html: `
            <h2>Appointment Update Confirmation</h2>
            <p>Dear Patient,</p>
            <p>Your appointment has been rescheduled from ${oldDay} at ${oldTime} to:</p>
            <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Doctor:</strong> ${doctor}</li>
                <li><strong>New Day:</strong> ${day}</li>
                <li><strong>New Time:</strong> ${time}</li>
                <li><strong>Appointment ID:</strong> ${appointmentId}</li>
            </ul>
            <p>Please save your appointment ID for future reference.</p>
            <p>If you need to make any changes, please use our chat interface.</p>
            <br>
            <p>Best regards,</p>
            <p>Medical Referral System Team</p>
        `
    };

    try {
        const result = await sendEmail(mailOptions);
        res.json({ success: true, message: 'Update confirmation email sent successfully', messageId: result.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            code: error.code,
            response: error.response,
            responseCode: error.responseCode
        });
        res.status(500).json({ success: false, message: 'Failed to send update email', error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
