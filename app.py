from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import subprocess
import threading
import webbrowser
from flask_cors import CORS
import spacy
from typing import Dict


app = Flask(__name__)
CORS(app)

MEDICAL_SPECIALTIES = {
    "Cardiologist": ["heart", "chest pain", "palpitations", "blood pressure", "cardiovascular"],
    "Dermatologist": ["skin", "rash", "acne", "itching", "dermal"],
    "Neurologist": ["headache", "migraine", "seizure", "brain", "nervous system"],
    "Orthopedist": ["bone", "joint", "fracture", "spine", "muscle pain"],
    "Gastroenterologist": ["stomach", "digestive", "abdomen", "liver", "intestine"],
    "Psychiatrist": ["depression", "anxiety", "mental health", "mood", "psychological"],
    "ENT": ["ear", "nose", "throat", "hearing", "sinus"],
    "Ophthalmologist": ["eye", "vision", "sight", "blindness", "optical"],
    "General Physician": ["fever", "fatigue", "weakness", "general health", "unknown"]
}

nlp = spacy.load('en_core_web_lg')

def analyze_symptoms(symptoms: str) -> str:
    doc = nlp(symptoms.lower())
    
    specialty_scores = {specialty: 0 for specialty in MEDICAL_SPECIALTIES}
   
    for specialty, keywords in MEDICAL_SPECIALTIES.items():
        for keyword in keywords:
            if keyword in symptoms.lower():
                specialty_scores[specialty] += 2
            
        for token in doc:
            if not token.is_stop and not token.is_punct:
                for keyword in keywords:
                    if token.has_vector and nlp(keyword)[0].has_vector:
                        similarity = token.similarity(nlp(keyword)[0])
                        if similarity > 0.7:
                            specialty_scores[specialty] += similarity

    max_score = max(specialty_scores.values())
    if max_score < 1.0:
        return "General Physician"
    
    return max(specialty_scores.items(), key=lambda x: x[1])[0]

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/analyze_symptoms', methods=['POST'])
def handle_symptoms():
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        recommendation = analyze_symptoms(symptoms)
        return jsonify({
            'specialty': recommendation,
            'message': f"Based on your symptoms, I recommend consulting a {recommendation}."
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def start_node_server():
    try:
        node_process = subprocess.Popen(['node', 'server.js'], 
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     text=True)
        return node_process
    except Exception as e:
        print(f"Error starting Node.js server: {e}")
        return None

def start_browser():
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    print("Starting Node.js server...")
    node_process = start_node_server()
    
    if node_process:
        flask_thread = threading.Thread(target=lambda: app.run(port=5000))
        flask_thread.daemon = True
        flask_thread.start()
        
        threading.Timer(1.5, start_browser).start()
        
        try:
            while True:
                output = node_process.stdout.readline()
                if output:
                    print(output.strip())
        except KeyboardInterrupt:
            print("\nShutting down...")
            node_process.terminate()
            sys.exit(0)
