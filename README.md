# 🧬 Automated Clinical Trial Information Extractor & Disease Cluster ML Engine
> **Patent US20250252261A1 Implementation**: Multi-Task Learning Architecture for Biomedical NLP (NER • Relation Extraction • Assertion Detection • K-Means Disease Clustering)

---

## 📌 Overview

Medical literature on **PubMed** grows by thousands of clinical trial abstracts daily. Manually reading these papers to extract target diseases, drug interventions, patient cohort sizes ($N$), and statistical outcomes takes hundreds of hours.

This project implements **Patent US20250252261A1**, providing an automated Multi-Task Learning (MTL) system and interactive web platform that ingests unstructured PubMed abstracts and transforms them into structured, relational biomedical knowledge stored in an indexed **SQLite database** (`clinical_trials.db`).

Furthermore, it features a **K-Means Machine Learning Clustering Engine** with **$L_2$ Regularization**, **USML Anomaly Detection**, and **SVML Decision Alignment Scoring** to automatically detect disease clusters across patient populations.

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

### 2. 🧠 K-Means ML Disease Cluster Trainer & Patient Group Classifier
- **TF-IDF Feature Vectorization**: Weighted term-document frequency matrix combined with log-scaled patient sample sizes ($\log_{10}(N) / 4.0$).
- **Unsupervised K-Means ($K=5$)**: Segments patient groups into 5 disease clusters:
  - `CLUSTER-CMD`: Cardiometabolic & Vascular (Heart Failure, Hypertension, Diabetes)
  - `CLUSTER-ONC`: Oncology & Tumor Burden (NSCLC, Triple-Negative Breast Cancer)
  - `CLUSTER-NEURO`: Neurodegenerative & Cognitive (Alzheimer's Disease)
  - `CLUSTER-INFECT`: Respiratory & Infectious (COVID-19 Pneumonia)
  - `CLUSTER-NEPHRO`: Nephrology & Inflammatory Organ (CKD, Rheumatoid Arthritis, NASH)
- **PCA 2D Dimensionality Reduction**: Projects high-dimensional feature vectors into 2D coordinates ($PC_1, PC_2$) rendered on an interactive scatterplot.

### 3. 🛡️ Overfitting Prevention & Diagnostic Metrics
- **80/20 Train-Validation Holdout Split**: Evaluates out-of-sample loss gap ($\Delta = |E_{\text{val}} - E_{\text{train}}|$).
- **$L_2$ Regularization Penalty ($\lambda = 0.05$)**: Prevents overfitting to noisy vocabulary quirks via L2 weight decay.
- **USML Anomaly Detection**: Identifies out-of-distribution rare diseases or conflicting multi-system symptom profiles.
- **SVML Decision Alignment Score**: Softmax hyperplane alignment scoring ($0-100\%$).

### 4. 🗄️ SQLite Relational Database & Multi-Format Exports
- Indexed relational table storing trial metadata, disease entities, cohort $N$, and assertion statuses.
- **1-Click Exporters**: Export full dataset to `.SQL` dump, `.CSV` spreadsheet, or `.JSON`.

### 5. 🎨 Bold Tactical Industrial Web UI
- Built with React, Vite, Tailwind CSS, and Chart.js.
- Dark slate design (`#020617`), glowing card overlays, monospaced data badges, and hover tooltips.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Chart.js, Lucide Icons
- **Backend / NLP**: Python 3, Regex Biomedical Extractors, SQLite 3
- **Machine Learning**: Unsupervised K-Means ($K=5$), TF-IDF Vectorizer, PCA 2D Projection, Softmax Classifier

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+) & `npm`
- Python (v3.8+)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local Web Application
```bash
npm run dev
```
The application will launch locally at **`http://localhost:3000/`**.

### 3. (Optional) Run the Python Backend CLI Extractor
Populate or update the SQLite database (`clinical_trials.db`) directly via CLI:
```bash
python clinical_extractor.py
```

---

## 📂 Project Structure

```
d:\sih\
├── clinical_extractor.py         # Python CLI Extractor & SQLite DB Builder
├── clinical_trials.db            # SQLite Relational Database (10 Disease Cohorts)
├── index.html                    # HTML Document Root
├── package.json                  # NPM Project Dependencies & Scripts
├── tailwind.config.js            # Tailwind CSS Configuration
├── vite.config.js                # Vite Server Configuration
└── src/
    ├── App.jsx                   # Main React Application & Tab Navigation
    ├── index.css                 # Tactical Dark Theme Styling & Grid Pattern
    ├── main.jsx                  # React DOM Entry Point
    ├── components/
    │   ├── Navbar.jsx            # Top Navigation Header & Patent Badge
    │   ├── PubMedSearch.jsx      # Live NCBI PubMed API Search & Custom Reader
    │   ├── MultiTaskViewer.jsx   # Patent US20250252261A1 Entity & Relation Inspector
    │   ├── DatabaseGrid.jsx      # SQLite Database Table & CSV/JSON/SQL Exporter
    │   ├── AnalyticsDashboard.jsx# Cohort Metrics, Histograms & Assertion Charts
    │   └── DiseaseClusterTrainer.jsx # ML K-Means Trainer, PCA Scatterplot & Predictor
    └── utils/
        ├── multiTaskExtractor.js # JavaScript Multi-Task NLP Engine
        ├── mlClusterTrainer.js   # K-Means, TF-IDF, PCA & USML/SVML Predictor
        ├── pubmedApi.js          # NCBI PubMed E-Utilities API Client
        └── sqliteExport.js       # CSV, JSON & SQL Export Handlers
```

---

## 📜 Patent Citation & License

This implementation is based on **Patent US20250252261A1**: *Multi-Task Learning Architecture for Biomedical Information Extraction*.

Licensed under the MIT License.
