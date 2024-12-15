Chatbot Application

A multi-functional chatbot application built with Python, Node.js, and JavaScript. This project combines backend and frontend technologies to deliver a seamless chatbot experience, including features like calendar integration and dynamic user interactions.

Features

Chatbot Functionality: Provides intelligent responses to user queries.

Calendar Integration: Allows users to manage schedules and events.

Dynamic Web Interface: Built with HTML, CSS, and JavaScript for an interactive user experience.

Node.js Backend: Handles server-side logic and email integrations

Technologies Used

Backend:

Python: For medical Bot logic

Node.js: Backend server 



Prerequisites

Before you begin, ensure you have the following installed:

Node.js (v14 or higher)

Python (v3.7 or higher)

npm (Node Package Manager)

Installation

Clone the Repository:  https://github.com/Sumukha09/Appointment_Booking_Chatbot.git


cd chatbot

Install Dependencies:

npm install

Set Up Environment Variables:

Create a .env file in the root directory.

Add necessary variables 
EMAIL_USER=Your gmail   ||
EMAIL_PASS=go to your manage your google account and find for app passwords and create a new app name and then obtain a unique password  ||
PORT= your port number Example 3000  ||
NODE_ENV=development ||
EMAIL_FROM_NAME="Medical Referral System"

For Running the Application just run python app.py
Access the Application:

Open your browser and navigate to http://localhost:3000.

File Structure

Chatbot/
├── .env                # Environment variables
├── .gitignore          # Git ignored files
├── app.py              # Python scripts (auxiliary functions)
├── calendar.js         # Calendar-related logic
├── index.html          # Main HTML file
├── node_modules/       # Node.js dependencies
├── package.json        # Node.js configuration
├── script.js           # Main JavaScript file
├── server.js           # Backend server logic
├── styles.css          # CSS for styling



