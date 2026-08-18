"""
Knowledge Graph Database Engine (NetworkX)
Patent US20250252261A1 — Upgraded from flat SQLite relational tables

Node Labels: :Trial, :Disease, :Drug, :Endpoint, :Cluster
Relationships: TREATS, TESTED_IN_COHORT, EVALUATES_ENDPOINT, BELONGS_TO_CLUSTER
"""

import json
import os
import networkx as nx
from datetime import datetime

GRAPH_FILE = os.path.join(os.path.dirname(__file__), "knowledge_graph.json")

_graph = nx.DiGraph()


def get_graph():
    """Return the current in-memory graph."""
    return _graph


def clear_graph():
    """Clear all nodes and edges."""
    _graph.clear()


# ---------------------------------------------------------------------------
# Node creation helpers
# ---------------------------------------------------------------------------

def add_trial_node(pmid, title, sample_size=0, phase="", authors=""):
    _graph.add_node(
        f"trial:{pmid}",
        label="Trial",
        pmid=pmid,
        title=title,
        sample_size=sample_size,
        phase=phase,
        authors=authors,
    )


def add_disease_node(name, mesh_id="", umls_cui=""):
    node_id = f"disease:{name.lower().strip()}"
    if not _graph.has_node(node_id):
        _graph.add_node(
            node_id,
            label="Disease",
            name=name,
            mesh_id=mesh_id,
            umls_cui=umls_cui,
        )
    return node_id


def add_drug_node(name, drug_class=""):
    node_id = f"drug:{name.lower().strip()}"
    if not _graph.has_node(node_id):
        _graph.add_node(
            node_id,
            label="Drug",
            name=name,
            drug_class=drug_class,
        )
    return node_id


def add_endpoint_node(name, p_value=None, statistical_significance=""):
    node_id = f"endpoint:{name.lower().strip()[:60]}"
    if not _graph.has_node(node_id):
        _graph.add_node(
            node_id,
            label="Endpoint",
            name=name,
            p_value=p_value,
            statistical_significance=statistical_significance,
        )
    return node_id


def add_cluster_node(cluster_id, top_keywords=None, c_tfidf_scores=None):
    node_id = f"cluster:{cluster_id}"
    _graph.add_node(
        node_id,
        label="Cluster",
        cluster_id=cluster_id,
        top_keywords=top_keywords or [],
        c_tfidf_scores=c_tfidf_scores or [],
    )
    return node_id


# ---------------------------------------------------------------------------
# Relationship creation helpers
# ---------------------------------------------------------------------------

def add_treats_relation(drug_name, disease_name, assertion="PRESENT_POSITIVE", confidence=0.9):
    drug_id = add_drug_node(drug_name)
    disease_id = add_disease_node(disease_name)
    _graph.add_edge(
        drug_id, disease_id,
        type="TREATS",
        assertion=assertion,
        confidence=confidence,
    )


def add_tested_in_cohort(pmid, disease_name, sample_size=0):
    trial_id = f"trial:{pmid}"
    disease_id = add_disease_node(disease_name)
    _graph.add_edge(
        trial_id, disease_id,
        type="TESTED_IN_COHORT",
        sample_size=sample_size,
    )


def add_evaluates_endpoint(pmid, endpoint_name, outcome="", p_value=None):
    trial_id = f"trial:{pmid}"
    ep_id = add_endpoint_node(endpoint_name, p_value=p_value)
    _graph.add_edge(
        trial_id, ep_id,
        type="EVALUATES_ENDPOINT",
        outcome=outcome,
        p_value=p_value,
    )


def add_belongs_to_cluster(pmid, cluster_id, probability=0.0, is_outlier=False):
    trial_id = f"trial:{pmid}"
    cluster_nid = f"cluster:{cluster_id}"
    if not _graph.has_node(cluster_nid):
        add_cluster_node(cluster_id)
    _graph.add_edge(
        trial_id, cluster_nid,
        type="BELONGS_TO_CLUSTER",
        probability=probability,
        is_outlier=is_outlier,
    )


# ---------------------------------------------------------------------------
# Populate graph from trial data + cluster results
# ---------------------------------------------------------------------------

def populate_from_trials(trials, cluster_results=None):
    """
    Build the full Knowledge Graph from trial records and optional BERTopic
    cluster results.
    """
    clear_graph()

    clustered_map = {}
    if cluster_results and "clusteredTrials" in cluster_results:
        for ct in cluster_results["clusteredTrials"]:
            clustered_map[ct["pmid"]] = ct

    # Create cluster nodes from topic keywords
    if cluster_results and "topicKeywords" in cluster_results:
        for cid_str, kw_list in cluster_results["topicKeywords"].items():
            cid = int(cid_str)
            keywords = [w for w, _ in kw_list]
            scores = [s for _, s in kw_list]
            add_cluster_node(cid, top_keywords=keywords, c_tfidf_scores=scores)

    for trial in trials:
        pmid = trial.get("pmid", "")
        extracted = trial.get("extracted", {})

        # Trial node
        add_trial_node(
            pmid=pmid,
            title=trial.get("title", ""),
            sample_size=extracted.get("sampleSize", 0),
            phase=extracted.get("studyDesign", ""),
            authors=trial.get("authors", ""),
        )

        # Disease node + TESTED_IN_COHORT relationship
        disease = extracted.get("disease", "")
        if disease:
            add_tested_in_cohort(pmid, disease, extracted.get("sampleSize", 0))

        # Drug node + TREATS relationship
        drug = extracted.get("intervention", "")
        if drug and disease:
            assertion = extracted.get("assertionStatus", "PRESENT_POSITIVE")
            confidence = (extracted.get("overallConfidence", 90)) / 100.0
            add_treats_relation(drug, disease, assertion, confidence)

        # Endpoint node + EVALUATES_ENDPOINT relationship
        outcome = extracted.get("primaryOutcome", "")
        if outcome:
            add_evaluates_endpoint(pmid, outcome[:80])

        # Cluster assignment
        if pmid in clustered_map:
            ct = clustered_map[pmid]
            add_belongs_to_cluster(
                pmid,
                ct["clusterId"],
                ct.get("probability", 0),
                ct.get("isOutlier", False),
            )

    return get_graph_summary()


# ---------------------------------------------------------------------------
# Query engine
# ---------------------------------------------------------------------------

def query_multi_hop_relations(start_name, max_hops=2):
    """
    Multi-hop graph traversal.
    Given a drug or disease name, find all connected entities within max_hops.

    Example: query_multi_hop_relations("semaglutide", max_hops=2)
    → Finds diseases it treats, trials that tested it, endpoints evaluated,
      and clusters those trials belong to.
    """
    # Find starting node(s) by fuzzy name match
    start_nodes = []
    query = start_name.lower().strip()
    for node_id, data in _graph.nodes(data=True):
        name_field = data.get("name", data.get("title", "")).lower()
        if query in name_field or query in node_id:
            start_nodes.append(node_id)

    if not start_nodes:
        return {"query": start_name, "hops": max_hops, "paths": [], "message": "No matching nodes found."}

    # BFS traversal up to max_hops
    visited = set()
    paths = []

    for start in start_nodes:
        queue = [(start, 0, [start])]
        visited.add(start)

        while queue:
            current, depth, path = queue.pop(0)
            if depth >= max_hops:
                continue

            for neighbor in list(_graph.successors(current)) + list(_graph.predecessors(current)):
                if neighbor not in visited:
                    visited.add(neighbor)
                    new_path = path + [neighbor]
                    edge_data = _graph.get_edge_data(current, neighbor) or _graph.get_edge_data(neighbor, current) or {}

                    paths.append({
                        "from": current,
                        "to": neighbor,
                        "relationship": edge_data.get("type", "RELATED"),
                        "properties": {k: v for k, v in edge_data.items() if k != "type"},
                        "hop": depth + 1,
                    })
                    queue.append((neighbor, depth + 1, new_path))

    return {
        "query": start_name,
        "hops": max_hops,
        "startNodes": start_nodes,
        "paths": paths,
        "totalRelations": len(paths),
    }


def get_nodes_by_label(label):
    """Return all nodes of a given label type (Trial, Disease, Drug, Endpoint, Cluster)."""
    results = []
    for node_id, data in _graph.nodes(data=True):
        if data.get("label", "").lower() == label.lower():
            results.append({"id": node_id, **data})
    return results


def get_graph_summary():
    """Return a high-level summary of the knowledge graph."""
    label_counts = {}
    for _, data in _graph.nodes(data=True):
        lbl = data.get("label", "Unknown")
        label_counts[lbl] = label_counts.get(lbl, 0) + 1

    rel_counts = {}
    for _, _, data in _graph.edges(data=True):
        rtype = data.get("type", "UNKNOWN")
        rel_counts[rtype] = rel_counts.get(rtype, 0) + 1

    return {
        "totalNodes": _graph.number_of_nodes(),
        "totalEdges": _graph.number_of_edges(),
        "nodeLabelCounts": label_counts,
        "relationshipCounts": rel_counts,
    }


# ---------------------------------------------------------------------------
# Persistence (JSON serialization)
# ---------------------------------------------------------------------------

def save_graph(filepath=None):
    """Serialize the graph to JSON."""
    filepath = filepath or GRAPH_FILE
    data = nx.node_link_data(_graph)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    return filepath


def load_graph(filepath=None):
    """Load graph from JSON."""
    global _graph
    filepath = filepath or GRAPH_FILE
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        _graph = nx.node_link_graph(data)
    return get_graph_summary()


def generate_cypher_export():
    """
    Generate Neo4j Cypher CREATE statements from the NetworkX graph.
    Useful for importing into a Neo4j instance.
    """
    lines = [
        "// ==========================================================",
        "// Knowledge Graph — Cypher Export",
        "// Patent US20250252261A1 Clinical Trial Extractor",
        f"// Generated: {datetime.utcnow().isoformat()}",
        "// ==========================================================",
        "",
    ]

    # Create nodes
    for node_id, data in _graph.nodes(data=True):
        label = data.get("label", "Entity")
        props = {k: v for k, v in data.items() if k != "label" and v is not None}
        prop_str = ", ".join(f'{k}: "{v}"' if isinstance(v, str) else f"{k}: {json.dumps(v)}" for k, v in props.items())
        lines.append(f'CREATE (:{label} {{id: "{node_id}", {prop_str}}})')

    lines.append("")

    # Create relationships
    for src, tgt, data in _graph.edges(data=True):
        rel_type = data.get("type", "RELATED")
        props = {k: v for k, v in data.items() if k != "type" and v is not None}
        prop_str = ", ".join(f'{k}: "{v}"' if isinstance(v, str) else f"{k}: {json.dumps(v)}" for k, v in props.items())
        match_clause = f'MATCH (a {{id: "{src}"}}), (b {{id: "{tgt}"}}) CREATE (a)-[:{rel_type} {{{prop_str}}}]->(b)'
        lines.append(match_clause)

    return "\n".join(lines)
