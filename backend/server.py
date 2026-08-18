"""
FastAPI Backend Server for BERTopic Clustering & Knowledge Graph
Patent US20250252261A1

Endpoints:
  POST /api/cluster/train    — Train BERTopic on trial data
  POST /api/cluster/predict  — Predict cluster for new patient group
  GET  /api/cluster/topics   — Get discovered topics & c-TF-IDF keywords
  GET  /api/graph/summary    — Knowledge Graph summary (node/edge counts)
  GET  /api/graph/nodes      — List nodes by label type
  POST /api/graph/query      — Multi-hop graph traversal
  GET  /api/graph/cypher     — Export graph as Cypher statements
  GET  /api/health           — Health check
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Add parent dir to path so we can import sibling modules
sys.path.insert(0, os.path.dirname(__file__))

import bertopic_engine
import graph_db

app = FastAPI(
    title="Clinical Trial BERTopic & Knowledge Graph API",
    description="Patent US20250252261A1 — BERTopic clustering + NetworkX Knowledge Graph",
    version="2.0.0",
)

# Allow CORS for React frontend (localhost:3000 / localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class TrainRequest(BaseModel):
    trials: list
    min_cluster_size: int = 5
    min_samples: int = 3
    umap_neighbors: int = 15
    umap_components: int = 5


class PredictRequest(BaseModel):
    disease: str = ""
    symptoms: str = ""
    cohortN: str = ""
    notes: str = ""


class GraphQueryRequest(BaseModel):
    query: str
    max_hops: int = 2


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    last = bertopic_engine.get_last_result()
    graph_summary = graph_db.get_graph_summary()
    return {
        "status": "ok",
        "engine": "BERTopic + HDBSCAN + NetworkX Knowledge Graph",
        "modelTrained": last is not None,
        "clusterCount": last["n_clusters"] if last else 0,
        "graphNodes": graph_summary["totalNodes"],
        "graphEdges": graph_summary["totalEdges"],
    }


# ---------------------------------------------------------------------------
# Clustering Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/cluster/train")
def train_clusters(req: TrainRequest):
    """Train BERTopic model on provided trial data and populate Knowledge Graph."""
    result = bertopic_engine.train_bertopic(
        trials=req.trials,
        min_cluster_size=req.min_cluster_size,
        min_samples=req.min_samples,
        umap_neighbors=req.umap_neighbors,
        umap_components=req.umap_components,
    )

    # Populate Knowledge Graph with trial data + cluster assignments
    graph_summary = graph_db.populate_from_trials(req.trials, result)
    graph_db.save_graph()

    result["graphSummary"] = graph_summary
    return result


@app.post("/api/cluster/predict")
def predict_cluster(req: PredictRequest):
    """Predict disease cluster for a new patient group."""
    return bertopic_engine.predict_cluster(req.dict())


@app.get("/api/cluster/topics")
def get_topics():
    """Return all discovered topics with c-TF-IDF keywords."""
    result = bertopic_engine.get_last_result()
    if result is None:
        return {"error": "Model not trained yet. POST to /api/cluster/train first."}
    return {
        "n_clusters": result["n_clusters"],
        "n_outliers": result["n_outliers"],
        "topicKeywords": result["topicKeywords"],
        "trainedAt": result["trainedAt"],
    }


@app.get("/api/cluster/result")
def get_last_result():
    """Return the full last training result."""
    result = bertopic_engine.get_last_result()
    if result is None:
        return {"error": "Model not trained yet."}
    return result


# ---------------------------------------------------------------------------
# Knowledge Graph Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/graph/summary")
def graph_summary():
    """Return Knowledge Graph node/edge count summary."""
    return graph_db.get_graph_summary()


@app.get("/api/graph/nodes")
def graph_nodes(label: str = "Trial"):
    """List all nodes of a given label type."""
    return graph_db.get_nodes_by_label(label)


@app.post("/api/graph/query")
def graph_query(req: GraphQueryRequest):
    """Multi-hop graph traversal query."""
    return graph_db.query_multi_hop_relations(req.query, req.max_hops)


@app.get("/api/graph/cypher")
def graph_cypher_export():
    """Export the entire Knowledge Graph as Neo4j Cypher CREATE statements."""
    cypher = graph_db.generate_cypher_export()
    return {"cypher": cypher, "totalNodes": graph_db.get_graph_summary()["totalNodes"]}


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  BERTopic & Knowledge Graph API Server")
    print("  Patent US20250252261A1")
    print("  Starting on http://localhost:8000")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
