# Implementation Plan: Automated Clinical Trial Literature Extractor
**Patent Reference**: US20250252261A1 (*Multi-Task Learning for Natural Language Processing Tasks*)

---

## 1. Executive Summary & Objective

The objective of this project is to automate the extraction of key parameters from unstructured randomized clinical trial (RCT) abstracts (sourced via the PubMed API) into a clean, queryable SQLite database.

The system extracts three primary parameters:
1. **Target Disease / Medical Condition**
2. **Intervention / Applied Drug & Dosage**
3. **Patient Sample Size ($N$)**

In accordance with **Patent US20250252261A1**, the system employs a Multi-Task Learning (MTL) architecture featuring a shared pre-trained language model encoder coupled with task-specific heads:
- **Task 1: Named Entity Recognition (NER)** — Identifies Disease, Intervention, and Sample Size ($N$).
- **Task 2: Relation Extraction (RE)** — Connects entities into semantic pairs (`TREATS`, `TESTED_IN_COHORT`).
- **Task 3: Assertion Detection (AD)** — Classifies outcome findings as `PRESENT_POSITIVE`, `ABSENT_NEGATED`, or `CONDITIONAL`.

---

## 2. System Architecture

```
                            ┌───────────────────────────┐
                            │    Raw PubMed Abstract    │
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │   Shared Encoder Layer    │
                            │ (Biomedical Token Vector) │
                            └─────────────┬─────────────┘
                                          │
             ┌────────────────────────────┼────────────────────────────┐
             ▼                            ▼                            ▼
  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
  │  Task 1: NER Head    │    │  Task 2: RE Head     │    │  Task 3: AD Head     │
  │                      │    │                      │    │                      │
  │ • Target Disease     │    │ • Drug -> Disease    │    │ • Present / Positive │
  │ • Intervention/Drug  │    │   (TREATS)           │    │ • Absent / Negated   │
  │ • Sample Size (N)    │    │ • Drug -> Cohort     │    │ • Conditional        │
  └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          ▼
                            ┌───────────────────────────┐
                            │  SQLite Relational DB &   │
                            │   Analytics Dashboard     │
                            └───────────────────────────┘
```

---

## 3. Step-by-Step Implementation Guide

### Step 1: Literature Ingestion Module
- **Live NCBI PubMed API**: Direct real-time search via NCBI E-utilities (`esearch` / `efetch`).
- **Benchmark Clinical Datasets**: Pre-loaded RCT abstracts across Cardiology, Oncology, Endocrinology, Neurology, and Infectious Diseases.
- **Custom Ingestion**: Support for pasting raw abstract text or uploading custom clinical text files.

### Step 2: Multi-Task Information Extractor (`multiTaskExtractor.js`)
- Jointly predicts entity spans, relation links, and assertion polarity.
- Computes multi-task extraction confidence scores for each paper.

### Step 3: SQLite Relational Database Engine (`clinical_trials.db`)
- Relational SQLite schema storing trial metadata, entity spans, and extracted relations.
- Multi-format exporters:
  - `.sql` DDL Database script (`clinical_trials.sql`)
  - `.csv` spreadsheet export
  - `.json` dataset export

### Step 4: Web Application Interface
- **Interactive Abstract Reader**: Color-coded entity highlighting (Purple = Disease, Emerald = Drug, Amber = Sample Size $N$, Cyan = Outcome).
- **Human-in-the-Loop Verification**: Enables researchers to review and edit extracted parameters inline.
- **Database Table Grid**: Searchable, filterable table with column sorting.
- **Analytics Dashboard**: Interactive charts for Sample Size distribution histograms and assertion status pie charts.

### Step 5: Standalone Python CLI Tool (`clinical_extractor.py`)
- Command-line utility for offline batch extraction and automated `clinical_trials.db` SQLite generation.

---

## 4. How to Run the Implementation

### Web Application Platform
```bash
# Launch Vite React Web Application
npx vite
# Access in browser at: http://localhost:3000/
```

### Python CLI Pipeline
```bash
# Execute CLI script to generate clinical_trials.db
python clinical_extractor.py --sample
```

---

## 5. Verification Checklist

- [x] Ingest PubMed abstracts & benchmark RCT dataset
- [x] Extract Target Disease, Intervention, and Sample Size ($N$)
- [x] Execute Relation Extraction & Assertion Detection (Patent US20250252261A1)
- [x] Save records to SQLite Database (`clinical_trials.db`)
- [x] Color-coded text highlighting in Abstract Reader
- [x] Export dataset to `.sql`, `.csv`, and `.json` formats
- [x] Visualize Sample Size distribution histogram and metrics
