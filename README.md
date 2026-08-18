# 🧬 Automated Clinical Trial Information Extractor & Knowledge Graph Engine

> **Patent US20250252261A1 Implementation**: Multi-Task Learning Architecture for Biomedical NLP (NER • Relation Extraction • Assertion Detection • BERTopic Clustering • Knowledge Graph)

---

## 📌 Overview

Medical literature on **PubMed** grows by thousands of clinical trial abstracts daily. Manually reading these papers to extract target diseases, drug interventions, patient cohort sizes ($N$), primary endpoints, and statistical outcomes takes hundreds of hours.

This project implements **Patent US20250252261A1**, providing an automated Multi-Task Learning (MTL) system and interactive web platform that ingests unstructured PubMed abstracts and transforms them into structured, relational biomedical knowledge stored in a **NetworkX Knowledge Graph** and indexed **SQLite database** (`clinical_trials.db`).

The platform features a state-of-the-art **BERTopic Machine Learning Clustering Engine** (Dense Sentence Embeddings + UMAP + HDBSCAN + c-TF-IDF) alongside a **Property Knowledge Graph Engine** capable of executing **multi-hop semantic queries** across drug-disease-endpoint pathways.

---

## ✨ Key Features

### 1. 🤖 Multi-Task Learning NLP Engine (Patent US20250252261A1)
Processes clinical abstracts across 3 simultaneous NLP heads:
- **Task 1: Named Entity Recognition (NER)**: Extracts Target Disease, Intervention/Drug, Sample Size ($N$), Trial Phase, and Primary Endpoints.
- **Task 2: Relation Extraction (RE)**: Links entities (e.g. `Semaglutide` $\xrightarrow{\text{TREATS}}$ `Heart Failure`, `Pembrolizumab` $\xrightarrow{\text{TESTED\_IN\_COHORT}}$ $N=616$).
- **Task 3: Assertion Detection (AD)**: Classifies clinical finding polarity:
  - `PRESENT_POSITIVE`: Statistically significant efficacy ($P < 0.001$).
  - `ABSENT_NEGATED`: Lack of statistical significance / failed primary endpoint ($P > 0.05$).
  - `CONDITIONAL`: Efficacy findings conditional on trial subgroup.

### 2. ⚡ BERTopic ML Clustering Engine
- **Dense Contextual Embeddings**: Uses `sentence-transformers/all-MiniLM-L6-v2` to project clinical abstracts into a 384-dimensional dense semantic vector space.
- **Non-Linear Dimensionality Reduction (UMAP)**: Applies UMAP (`n_neighbors=15`, `n_components=5`, `metric='cosine'`) to preserve semantic manifolds.
- **Density-Based Clustering (HDBSCAN)**: Automatically discovers variable disease clusters without hardcoding $K$ (`min_cluster_size=5`, `min_samples=3`).
- **Native Anomaly Detection**: Maps HDBSCAN noise points (Cluster ID `-1`) directly to outlier probabilities, replacing arbitrary distance thresholds.
- **c-TF-IDF Topic Keywords**: Class-based TF-IDF dynamically extracts top representative disease biomarkers and clinical keyword profiles per cluster.

### 3. 🕸️ Property Knowledge Graph & Multi-Hop Query Engine
- **Node Types**: `:Trial`, `:Disease`, `:Drug`, `:Endpoint`, `:Cluster`
- **Relationship Types**: `TREATS`, `TESTED_IN_COHORT`, `EVALUATES_ENDPOINT`, `BELONGS_TO_CLUSTER`
- **Multi-Hop Traversal**: Executes BFS graph traversals (`query_multi_hop_relations`) to discover multi-step pathways (e.g., *Find all diseases sharing therapeutic drugs or endpoints*).
- **Cypher Export**: Generates Neo4j-compatible `CREATE` statements for enterprise graph integration.

### 4. 🔄 Graceful In-Browser Fallback Engine
- If the Python backend is offline, the React frontend seamlessly falls back to an in-browser **TF-IDF + K-Means ($K=5$) Engine** with $L_2$ regularization penalty ($\lambda = 0.05$).
- Live UI status badge indicates whether the system is connected to the **`[⚡ BERTopic Engine]`** or running in **`[🔧 Legacy K-Means]`** fallback mode.

### 5. 🗄️ Relational Database & Multi-Format Exporters
- Export trial records and extracted triples to **`.SQL`** dumps, **`.CSV`** spreadsheets, **`.JSON`**, or **`.CYPHER`** graph scripts.

### 6. 🎨 Crisp White / Slate Light Theme UI
- Modern, high-contrast light interface built with React, Vite, and Tailwind CSS.
- Features smooth sliding container tab navigation, interactive scatterplots, and live confidence tuning sliders.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Chart.js, Lucide Icons
- **Python Backend**: FastAPI, Uvicorn, BERTopic, Sentence-Transformers (`all-MiniLM-L6-v2`), UMAP-learn, HDBSCAN, NetworkX, Scikit-Learn
- **Databases**: NetworkX Property Graph (`knowledge_graph.json`), SQLite 3 (`clinical_trials.db`), Neo4j Cypher export

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+) & `npm`
- Python (v3.8+) & `pip`

### 1. Frontend Web App Setup
```bash
# Install frontend dependencies
npm install

# Start local React development server
npm run dev
```
The application will launch locally at **`http://localhost:3000/`**.

### 2. Python Backend & BERTopic Setup
```bash
# Install backend Python dependencies
cd backend
pip install -r requirements.txt

# Run the migration script (re-cluster SQLite data -> build Knowledge Graph)
python migrate.py

# Start the FastAPI backend server
python server.py
```
The backend API server will run at **`http://localhost:8000/`**.

---

## 📂 Project Structure

```
d:\sih\
├── backend/                      # Python BERTopic & Knowledge Graph Service
│   ├── bertopic_engine.py        # Embeddings + UMAP + HDBSCAN + c-TF-IDF Pipeline
│   ├── graph_db.py               # NetworkX Property Graph & Multi-Hop Query Engine
│   ├── server.py                 # FastAPI REST Endpoints (/api/cluster, /api/graph)
│   ├── migrate.py                # SQLite -> BERTopic -> Knowledge Graph Migration
│   └── requirements.txt          # Python Backend Package Dependencies
├── clinical_extractor.py         # Python CLI Extractor & SQLite DB Builder
├── clinical_trials.db            # SQLite Relational Database
├── BERTOPIC_EXPLANATION.txt      # Plain-Language Explanation of BERTopic & Graph DB
├── HOW_IT_WORKS.txt              # Simple Plain-Language System Architecture Guide
├── SOLUTION_EXPLANATION.txt      # Technical Deep Dive Document
├── index.html                    # HTML Document Root
├── package.json                  # NPM Project Dependencies & Scripts
├── tailwind.config.js            # Tailwind CSS Configuration
├── vite.config.js                # Vite Server Configuration
└── src/
    ├── App.jsx                   # React App & Sliding Tab Wrapper
    ├── index.css                 # Crisp White Light Theme Styling
    ├── main.jsx                  # React Entry Point
    ├── components/
    │   ├── Navbar.jsx            # Header Bar & Engine Status Badge
    │   ├── PubMedSearch.jsx      # NCBI PubMed API Search & Extractor
    │   ├── MultiTaskViewer.jsx   # Entity, Relation & Assertion Inspector
    │   ├── DatabaseGrid.jsx      # Database Table & Multi-Format Exporter
    │   ├── AnalyticsDashboard.jsx# Metrics, Histograms & Assertion Charts
    │   └── DiseaseClusterTrainer.jsx # BERTopic / K-Means ML Trainer & Predictor
    └── utils/
        ├── bertopicClient.js     # API Client for Python Backend with K-Means Fallback
        ├── multiTaskExtractor.js # JavaScript Multi-Task NLP Engine
        ├── mlClusterTrainer.js   # Legacy In-Browser K-Means & TF-IDF Engine
        ├── pubmedApi.js          # NCBI PubMed E-Utilities API Client
        └── sqliteExport.js       # SQL, CSV, JSON & Cypher Graph Exporters
```

---

## 📜 Plain-Language Explanation Guides

- **`BERTOPIC_EXPLANATION.txt`**: Explains BERTopic, UMAP, HDBSCAN, c-TF-IDF, and Knowledge Graphs in simple terms.
- **`HOW_IT_WORKS.txt`**: Explains how clinical papers are read, extracted, and classified in simple language.
- **`SOLUTION_EXPLANATION.txt`**: Full technical specification of the Patent US20250252261A1 implementation.

---

## 📜 Patent Citation & License

This implementation is based on **Patent US20250252261A1**: *Multi-Task Learning Architecture for Biomedical Information Extraction*.

Licensed under the MIT License.
