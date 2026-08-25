<div align="center">
  <h1>🧠 NeuroSpace (NeuroPace)</h1>
  <p><strong>A clinical-grade, AI-powered concussion recovery platform featuring automated ML eye-tracking and an advanced Hybrid Ensemble RAG medical assistant.</strong></p>
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
3. **🤖 Hybrid Ensemble Medical RAG**: A highly advanced AI assistant powered by **Google Gemini 3.6 Flash**. It is strictly constrained by a dual-vector database pipeline that utilizes Parent-Child semantic retrieval and fast algorithmic deduplication to ensure perfectly accurate, hallucination-free protocol guidance directly from official consensus PDFs.

---

## 🏗️ The Hybrid Ensemble RAG Architecture (How it Works)

We moved beyond standard RAG to build an enterprise-grade hybrid retrieval pipeline that prevents token bloat and context loss. 

* **PyMuPDF Layout-Aware Parsing:** The backend intelligently scans PDF blocks rather than raw text, preserving multi-column layouts commonly found in clinical research papers.
* **Zero-Shot VLM Flowchart Extraction:** If configured, the backend renders PDF pages as high-fidelity images, passing them to Gemini Vision to dynamically extract medical algorithms and flowcharts into structured Markdown.
* **Dual-Pipeline Deduplication:** 
    * **Pipeline A (Parent-Child):** Groups text into 300-character sub-chunks tied to massive 1500-character parent chunks for broad context.
    * **Pipeline B (Dense):** Groups text into standard 500-character chunks for highly-specific factual retrieval.
    * When a user queries the AI, it queries both pipelines simultaneously and algorithmically deduplicates overlapping chunks in memory before feeding the final optimized context to the LLM.

---

## 🛠️ Technology Stack
* **Frontend:** Next.js, React, TailwindCSS, TypeScript
* **Backend:** FastAPI, Python, SQLite, SQLAlchemy
* **AI & Machine Learning:** Google Gemini API, LangChain, PyMuPDF, ChromaDB, WebGazer.js (Ridge Regression ML Edge Compute)

---

## ⚙️ How to Install and Run Locally

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

# (Optional) Enable Advanced VLM Flowchart Extraction during boot:
# $env:GEMINI_API_KEY="your-api-key"

# Start the server
uvicorn main:app --reload
```
> [!TIP]
> **Dynamic Ephemeral Knowledge Base**
> The backend builds the Hybrid Ensemble Vector databases entirely in memory on startup! If you add or remove clinical PDFs in the `backend/data/` folder, simply restart the FastAPI server. You do not need to manually delete any cache folders.

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
To use the Medical AI Assistant, paste your Gemini API key directly into the secure UI input field (it is passed strictly to the backend and never saved).

---

## 🏆 Hackathon Notes
**Machine Learning Challenge:**
Building a clinical-grade eye-tracking system in a browser without infrared hardware was incredibly difficult. We encountered a deep machine learning failure ("Matrix Singularity") where feeding continuous, highly-correlated data points into the Ridge Regression model caused the matrix determinant to approach zero. We engineered a **"Guided Saccade"** automated calibration sequence, injecting synthetic zero-latency click events at 9 extreme boundary nodes to forcefully stabilize the bounding box of the regression matrix.
