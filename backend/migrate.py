"""
Migration Script: SQLite → BERTopic Re-Clustering → Knowledge Graph
Patent US20250252261A1

Reads existing trial records from clinical_trials.db (or embedded benchmark data),
re-clusters them with the BERTopic pipeline, and populates the Knowledge Graph.

Usage:
  python backend/migrate.py
"""

import os
import sys
import json
import sqlite3

# Add backend dir to path
sys.path.insert(0, os.path.dirname(__file__))
parent_dir = os.path.dirname(os.path.dirname(__file__))

import bertopic_engine
import graph_db


# Embedded benchmark trials (same as clinical_extractor.py) for when DB is empty
BENCHMARK_TRIALS = [
    {
        "pmid": "35657801",
        "title": "Semaglutide in Patients with Heart Failure with Preserved Ejection Fraction and Obesity",
        "journal": "N Engl J Med",
        "year": 2023,
        "authors": "Kosiborod MN, et al.",
        "abstract": "Semaglutide 2.4 mg weekly in 529 patients with heart failure and obesity. KCCQ score improved significantly (P<0.001). Body weight change -13.3% vs -2.6%.",
        "extracted": {
            "disease": "Heart Failure with Preserved Ejection Fraction",
            "intervention": "Semaglutide",
            "sampleSize": 529,
            "studyDesign": "Randomized Double-Blind Phase III Trial",
            "primaryOutcome": "KCCQ clinical summary score improvement",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 95,
        },
    },
    {
        "pmid": "34525287",
        "title": "Pembrolizumab plus Chemotherapy in Advanced Non-Small-Cell Lung Cancer",
        "journal": "Lancet Oncol",
        "year": 2022,
        "authors": "Gandhi L, et al.",
        "abstract": "Phase III trial, 616 patients with untreated NSCLC. Overall survival 69.2% vs 49.4% (P<0.001). Pembrolizumab prolonged overall survival.",
        "extracted": {
            "disease": "Non-Small-Cell Lung Cancer (NSCLC)",
            "intervention": "Pembrolizumab + Chemotherapy",
            "sampleSize": 616,
            "studyDesign": "Randomized Double-Blind Phase III Trial",
            "primaryOutcome": "Overall survival at 12 months",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 96,
        },
    },
    {
        "pmid": "33285061",
        "title": "Empagliflozin in Patients with Type 2 Diabetes Mellitus and High Cardiovascular Risk",
        "journal": "N Engl J Med",
        "year": 2021,
        "authors": "Zinman B, et al.",
        "abstract": "SGLT2 inhibitor empagliflozin in 7020 patients with type 2 diabetes. Primary composite outcome 10.5% vs 12.1% (P=0.04).",
        "extracted": {
            "disease": "Type 2 Diabetes Mellitus",
            "intervention": "Empagliflozin",
            "sampleSize": 7020,
            "studyDesign": "Randomized Double-Blind Trial",
            "primaryOutcome": "Cardiovascular death composite endpoint",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 93,
        },
    },
    {
        "pmid": "31881142",
        "title": "Donepezil and Memantine Combination in Moderate-to-Severe Alzheimer's Disease",
        "journal": "JAMA Neurol",
        "year": 2020,
        "authors": "Howard R, et al.",
        "abstract": "Double-blind trial of 295 patients with Alzheimer's disease. Donepezil 10mg plus memantine 20mg. ADAS-cog improvement (P<0.001).",
        "extracted": {
            "disease": "Alzheimer's Disease",
            "intervention": "Donepezil + Memantine",
            "sampleSize": 295,
            "studyDesign": "Randomized Double-Blind Trial",
            "primaryOutcome": "ADAS-cog cognitive improvement",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 92,
        },
    },
    {
        "pmid": "32392437",
        "title": "Remdesivir for Hospitalized Patients with Severe COVID-19 Pneumonia",
        "journal": "N Engl J Med",
        "year": 2020,
        "authors": "Beigel JH, et al.",
        "abstract": "Randomized trial of 1062 hospitalized COVID-19 patients. Remdesivir shortened recovery time (P<0.001). 29-day mortality 11.4% vs 15.2%.",
        "extracted": {
            "disease": "Severe COVID-19 Pneumonia",
            "intervention": "Remdesivir",
            "sampleSize": 1062,
            "studyDesign": "Randomized Double-Blind Placebo-Controlled Trial",
            "primaryOutcome": "Time to recovery (hospital discharge)",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 94,
        },
    },
    {
        "pmid": "36477384",
        "title": "Dapagliflozin in Chronic Kidney Disease with Reduced and Preserved Ejection Fraction",
        "journal": "N Engl J Med",
        "year": 2023,
        "authors": "McMurray JJV, et al.",
        "abstract": "SGLT2 inhibitor dapagliflozin in 4304 patients with CKD. Reduced composite kidney failure endpoint by 39% (P<0.001).",
        "extracted": {
            "disease": "Chronic Kidney Disease",
            "intervention": "Dapagliflozin",
            "sampleSize": 4304,
            "studyDesign": "Randomized Double-Blind Phase III Trial",
            "primaryOutcome": "Composite kidney failure endpoint",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 95,
        },
    },
    {
        "pmid": "37459977",
        "title": "Upadacitinib vs Adalimumab in Moderate-to-Severe Rheumatoid Arthritis",
        "journal": "Lancet",
        "year": 2023,
        "authors": "Fleischmann R, et al.",
        "abstract": "Phase III SELECT-COMPARE trial of 1629 patients with RA. Upadacitinib superior to adalimumab in ACR50 response (P<0.001).",
        "extracted": {
            "disease": "Rheumatoid Arthritis",
            "intervention": "Upadacitinib",
            "sampleSize": 1629,
            "studyDesign": "Randomized Double-Blind Phase III Trial",
            "primaryOutcome": "ACR50 response rate at week 12",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 94,
        },
    },
    {
        "pmid": "38119234",
        "title": "Resmetirom for Resolution of NASH with Liver Fibrosis",
        "journal": "N Engl J Med",
        "year": 2024,
        "authors": "Harrison SA, et al.",
        "abstract": "Phase III MAESTRO-NASH trial of 966 patients. Resmetirom achieved NASH resolution in 29.9% vs 9.7% placebo (P<0.001).",
        "extracted": {
            "disease": "Non-Alcoholic Steatohepatitis (NASH)",
            "intervention": "Resmetirom",
            "sampleSize": 966,
            "studyDesign": "Randomized Double-Blind Phase III Trial",
            "primaryOutcome": "NASH resolution without worsening fibrosis",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 91,
        },
    },
    {
        "pmid": "33475478",
        "title": "Atezolizumab plus Bevacizumab in Unresectable Hepatocellular Carcinoma",
        "journal": "N Engl J Med",
        "year": 2021,
        "authors": "Finn RS, et al.",
        "abstract": "IMbrave150 trial of 501 patients with HCC. Atezolizumab-bevacizumab improved OS hazard ratio 0.58 (P<0.001).",
        "extracted": {
            "disease": "Hepatocellular Carcinoma (HCC)",
            "intervention": "Atezolizumab + Bevacizumab",
            "sampleSize": 501,
            "studyDesign": "Randomized Open-Label Phase III Trial",
            "primaryOutcome": "Overall survival hazard ratio",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 93,
        },
    },
    {
        "pmid": "35766368",
        "title": "Trastuzumab Deruxtecan in Previously Treated HER2-Low Breast Cancer",
        "journal": "N Engl J Med",
        "year": 2022,
        "authors": "Modi S, et al.",
        "abstract": "DESTINY-Breast04 trial of 557 patients. Progression-free survival 10.1 vs 5.4 months (P<0.001).",
        "extracted": {
            "disease": "HER2-Low Breast Cancer",
            "intervention": "Trastuzumab Deruxtecan",
            "sampleSize": 557,
            "studyDesign": "Randomized Open-Label Phase III Trial",
            "primaryOutcome": "Progression-free survival",
            "assertionStatus": "PRESENT_POSITIVE",
            "overallConfidence": 95,
        },
    },
]


def load_trials_from_sqlite():
    """Attempt to read trials from the existing SQLite database."""
    db_path = os.path.join(parent_dir, "clinical_trials.db")
    if not os.path.exists(db_path):
        return []

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT * FROM clinical_trials")
        rows = cursor.fetchall()
        conn.close()

        trials = []
        for row in rows:
            r = dict(row)
            trials.append({
                "pmid": r.get("pmid", ""),
                "title": r.get("title", ""),
                "journal": r.get("journal", ""),
                "year": r.get("pub_year", 2024),
                "authors": r.get("authors", ""),
                "extracted": {
                    "disease": r.get("target_disease", ""),
                    "intervention": r.get("intervention", ""),
                    "sampleSize": r.get("sample_size_n", 0),
                    "studyDesign": r.get("study_design", ""),
                    "primaryOutcome": r.get("primary_outcome", ""),
                    "assertionStatus": r.get("assertion_status", "PRESENT_POSITIVE"),
                    "overallConfidence": r.get("confidence_score", 90),
                },
            })
        return trials
    except Exception as e:
        print(f"[WARN] Could not read SQLite DB: {e}")
        return []


def run_migration():
    """Main migration pipeline."""
    print("=" * 60)
    print("  MIGRATION: SQLite → BERTopic → Knowledge Graph")
    print("  Patent US20250252261A1")
    print("=" * 60)

    # Step 1: Load trials
    print("\n[1/4] Loading trial data...")
    trials = load_trials_from_sqlite()
    if not trials:
        print("  No trials in SQLite DB. Using embedded benchmark dataset.")
        trials = BENCHMARK_TRIALS
    print(f"  Loaded {len(trials)} trials.")

    # Step 2: Train BERTopic
    print("\n[2/4] Training BERTopic pipeline...")
    print("  Embedding model: all-MiniLM-L6-v2")
    print("  UMAP: n_neighbors=15, n_components=5, metric=cosine")
    print("  HDBSCAN: min_cluster_size=5, min_samples=3")
    result = bertopic_engine.train_bertopic(trials)
    print(f"  Discovered {result['n_clusters']} clusters, {result['n_outliers']} outliers.")
    print(f"  Mean cluster probability: {result['meanProbability']}%")

    # Step 3: Populate Knowledge Graph
    print("\n[3/4] Populating Knowledge Graph...")
    graph_summary = graph_db.populate_from_trials(trials, result)
    print(f"  Nodes: {graph_summary['totalNodes']}")
    print(f"  Edges: {graph_summary['totalEdges']}")
    print(f"  Node types: {graph_summary['nodeLabelCounts']}")
    print(f"  Relationship types: {graph_summary['relationshipCounts']}")

    # Step 4: Save
    print("\n[4/4] Saving Knowledge Graph to disk...")
    filepath = graph_db.save_graph()
    print(f"  Saved to: {filepath}")

    # Print topic keywords
    print("\n" + "=" * 60)
    print("  DISCOVERED DISEASE CLUSTERS (c-TF-IDF Keywords)")
    print("=" * 60)
    for cid_str, kw_list in result["topicKeywords"].items():
        cid = int(cid_str)
        label = "OUTLIERS" if cid == -1 else f"Cluster {cid}"
        keywords = ", ".join(w for w, _ in kw_list[:6])
        print(f"  [{label}] → {keywords}")

    # Demo multi-hop query
    print("\n" + "=" * 60)
    print("  DEMO: Multi-Hop Graph Query (Semaglutide, 2 hops)")
    print("=" * 60)
    query_result = graph_db.query_multi_hop_relations("semaglutide", max_hops=2)
    print(f"  Found {query_result['totalRelations']} relationships:")
    for path in query_result["paths"][:8]:
        print(f"    {path['from']} --[{path['relationship']}]--> {path['to']}")

    print("\n✓ Migration complete.")
    return result


if __name__ == "__main__":
    run_migration()
