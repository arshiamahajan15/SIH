/**
 * BERTopic API Client with Legacy K-Means Fallback
 * Patent US20250252261A1
 *
 * Calls the Python FastAPI backend for BERTopic clustering & Knowledge Graph queries.
 * If the backend is unreachable, gracefully falls back to the in-browser
 * legacy mlClusterTrainer.js (TF-IDF + K-Means).
 */

const BACKEND_URL = 'http://localhost:8000';

let _backendOnline = null; // null = unknown, true/false = cached result
let _lastHealthCheck = 0;

/**
 * Check if the Python BERTopic backend is online.
 * Caches the result for 30 seconds to avoid spamming.
 */
export async function isBackendOnline() {
  const now = Date.now();
  if (_backendOnline !== null && now - _lastHealthCheck < 30000) {
    return _backendOnline;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    _backendOnline = res.ok;
  } catch {
    _backendOnline = false;
  }
  _lastHealthCheck = now;
  return _backendOnline;
}

/**
 * Train BERTopic model via the Python backend.
 * Falls back to legacy K-Means if backend is offline.
 */
export async function trainBERTopic(trials, params = {}) {
  const online = await isBackendOnline();

  if (!online) {
    // Fallback to legacy K-Means
    const { trainKMeansModel } = await import('./mlClusterTrainer.js');
    const legacyResult = trainKMeansModel(
      trials,
      params.kClusters || 5,
      30,
      params.useL2 !== false,
      params.l2Lambda || 0.05
    );
    return { ...legacyResult, engine: 'Legacy K-Means (Fallback)', isFallback: true };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/cluster/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trials,
        min_cluster_size: params.minClusterSize || 5,
        min_samples: params.minSamples || 3,
        umap_neighbors: params.umapNeighbors || 15,
        umap_components: params.umapComponents || 5,
      }),
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    return { ...data, isFallback: false };
  } catch (err) {
    console.warn('[BERTopic Client] Backend train failed, falling back to K-Means:', err.message);
    _backendOnline = false;
    const { trainKMeansModel } = await import('./mlClusterTrainer.js');
    const legacyResult = trainKMeansModel(trials, 5, 30, true, 0.05);
    return { ...legacyResult, engine: 'Legacy K-Means (Fallback)', isFallback: true };
  }
}

/**
 * Predict disease cluster for a new patient group.
 */
export async function predictCluster(patientInput) {
  const online = await isBackendOnline();

  if (!online) {
    const { predictDiseaseCluster } = await import('./mlClusterTrainer.js');
    const { trainKMeansModel } = await import('./mlClusterTrainer.js');
    // Note: for fallback prediction, the model must already be trained in-memory
    return null; // Caller should handle fallback
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/cluster/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientInput),
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[BERTopic Client] Predict failed:', err.message);
    return null;
  }
}

/**
 * Get discovered topics & c-TF-IDF keywords from BERTopic.
 */
export async function getTopics() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cluster/topics`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get Knowledge Graph summary (node/edge counts).
 */
export async function getGraphSummary() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/graph/summary`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Multi-hop graph traversal query.
 */
export async function queryGraph(queryText, maxHops = 2) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/graph/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, max_hops: maxHops }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get graph nodes by label type.
 */
export async function getGraphNodes(label = 'Trial') {
  try {
    const res = await fetch(`${BACKEND_URL}/api/graph/nodes?label=${encodeURIComponent(label)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Export Knowledge Graph as Cypher statements.
 */
export async function exportCypher() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/graph/cypher`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
