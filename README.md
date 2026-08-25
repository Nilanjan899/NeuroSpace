<div align="center">
  <h1>🧠 NeuroSpace (NeuroPace)</h1>
  <p><strong>A clinical-grade, AI-powered concussion recovery platform featuring automated ML eye-tracking and guardrailed medical guidance.</strong></p>
</div>

---

## 💡 The Problem: The "Cocooning Fallacy"
For decades, the standard medical advice for a concussion was "cocooning"—putting the patient in a dark room and avoiding all physical and cognitive activity. Recent clinical consensus, including the **6th International Consensus Statement on Concussion in Sport**, has completely debunked this. Prolonged rest actually *delays* recovery. The new gold standard is **active recovery**—targeted autonomic conditioning and vestibular rehabilitation. 

However, specialized clinical tools like the Buffalo Concussion Treadmill Test (BCTT) and Vestibular/Ocular Motor Screening (VOMS) are heavily gatekept by expensive sports medicine clinics.

## 🚀 Our Solution
NeuroSpace democratizes these tools, bringing clinical-grade, AI-driven active concussion recovery directly into the browser for anyone with a webcam and an internet connection.

### Core Features:
1. **🏃‍♂️ BCTT Pacing Engine**: An interactive module that tracks the user's age and calculates sub-symptom heart rate thresholds based on the Buffalo Concussion Treadmill Test protocol, actively managing their physical recovery limits.
2. **👁️ AI VOMS Eye-Tracking**: A browser-based Vestibular/Ocular Motor Screening module. Using the webcam, it tracks the user's pupil movements during "Guided Saccade" exercises, automating a test that typically requires a physical clinician.
3. **🤖 Guardrailed Medical AI**: A sophisticated RAG (Retrieval-Augmented Generation) assistant powered by **Google Gemini 3.6 Flash**. It is strictly constrained by a vector database of official clinical consensus documents, ensuring patients receive accurate, hallucination-free protocol guidance.

---

## 🛠️ Technology Stack
* **Frontend:** Next.js, React, TailwindCSS, TypeScript
* **Backend:** FastAPI, Python, SQLite, SQLAlchemy
* **AI & Machine Learning:** Google Gemini API, LangChain, ChromaDB, WebGazer.js (Ridge Regression ML Edge Compute)

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A [Google Gemini API Key](https://aistudio.google.com/)

### 1. Start the FastAPI Backend
```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```
*The backend will automatically ingest the clinical PDFs in `backend/data/` and construct the local ChromaDB vector store on boot.*

> [!TIP]
> **Modifying the AI's Knowledge Base**
> If you add or remove PDF documents in the `backend/data/` folder, you must delete the `backend/chroma_db_v2` directory and restart the server. This forces the system to rebuild a fresh, updated vector database.

### 2. Start the Next.js Frontend
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Usage
Navigate to `http://localhost:3000`. 
To use the Medical AI Assistant, paste your Gemini API key directly into the secure UI input field (it is passed directly to the backend and never saved).

---

## 🏆 Hackathon Notes
**Machine Learning Challenge:**
Building a clinical-grade eye-tracking system in a browser without infrared hardware was incredibly difficult. We encountered a deep machine learning failure ("Matrix Singularity") where feeding continuous, highly-correlated data points into the Ridge Regression model caused the matrix determinant to approach zero. We engineered a **"Guided Saccade"** automated calibration sequence, injecting synthetic zero-latency click events at 9 extreme boundary nodes to forcefully stabilize the bounding box of the regression matrix.
