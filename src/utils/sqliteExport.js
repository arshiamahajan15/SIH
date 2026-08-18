/**
 * SQLite Database Builder & Export Utility
 * Generates relational database schema (DDL & DML) and downloads CSV/JSON/SQL files.
 */

export function generateSQLiteDDL(trials) {
  let sql = `-- =========================================================================\n`;
  sql += `-- AUTOMATED CLINICAL TRIAL LITERATURE EXTRACTOR DATABASE\n`;
  sql += `-- Multi-Task Learning Architecture (Patent US20250252261A1)\n`;
  sql += `-- Generated At: ${new Date().toISOString()}\n`;
  sql += `-- =========================================================================\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS clinical_trials (\n`;
  sql += `  pmid TEXT PRIMARY KEY,\n`;
  sql += `  title TEXT NOT NULL,\n`;
  sql += `  journal TEXT,\n`;
  sql += `  pub_year INTEGER,\n`;
  sql += `  authors TEXT,\n`;
  sql += `  target_disease TEXT,\n`;
  sql += `  intervention TEXT,\n`;
  sql += `  sample_size_n INTEGER,\n`;
  sql += `  study_design TEXT,\n`;
  sql += `  primary_outcome TEXT,\n`;
  sql += `  assertion_status TEXT,\n`;
  sql += `  confidence_score INTEGER,\n`;
  sql += `  created_at TEXT\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS trial_entities (\n`;
  sql += `  entity_id TEXT PRIMARY KEY,\n`;
  sql += `  pmid TEXT,\n`;
  sql += `  entity_type TEXT,\n`;
  sql += `  entity_label TEXT,\n`;
  sql += `  entity_text TEXT,\n`;
  sql += `  confidence REAL,\n`;
  sql += `  FOREIGN KEY (pmid) REFERENCES clinical_trials (pmid)\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS trial_relations (\n`;
  sql += `  relation_id TEXT PRIMARY KEY,\n`;
  sql += `  pmid TEXT,\n`;
  sql += `  relation_type TEXT,\n`;
  sql += `  source_entity TEXT,\n`;
  sql += `  target_entity TEXT,\n`;
  sql += `  confidence REAL,\n`;
  sql += `  FOREIGN KEY (pmid) REFERENCES clinical_trials (pmid)\n`;
  sql += `);\n\n`;

  // Indexes for performance
  sql += `CREATE INDEX IF NOT EXISTS idx_disease ON clinical_trials(target_disease);\n`;
  sql += `CREATE INDEX IF NOT EXISTS idx_intervention ON clinical_trials(intervention);\n`;
  sql += `CREATE INDEX IF NOT EXISTS idx_sample_size ON clinical_trials(sample_size_n);\n\n`;

  // Insert Records
  sql += `-- =========================================================================\n`;
  sql += `-- DATA INSERTS (${trials.length} Clinical Trials)\n`;
  sql += `-- =========================================================================\n\n`;

  trials.forEach(trial => {
    const pmid = escapeSql(trial.pmid);
    const title = escapeSql(trial.title);
    const journal = escapeSql(trial.journal);
    const year = trial.year || 2024;
    const authors = escapeSql(trial.authors);
    const disease = escapeSql(trial.extracted.disease);
    const intervention = escapeSql(trial.extracted.intervention);
    const sampleSize = typeof trial.extracted.sampleSize === 'number' ? trial.extracted.sampleSize : (parseInt(trial.extracted.sampleSize, 10) || 0);
    const design = escapeSql(trial.extracted.studyDesign);
    const outcome = escapeSql(trial.extracted.primaryOutcome);
    const assertion = escapeSql(trial.extracted.assertionStatus);
    const confidence = trial.extracted.overallConfidence || 90;

    sql += `INSERT OR REPLACE INTO clinical_trials (\n`;
    sql += `  pmid, title, journal, pub_year, authors, target_disease, intervention, sample_size_n, study_design, primary_outcome, assertion_status, confidence_score, created_at\n`;
    sql += `) VALUES (\n`;
    sql += `  '${pmid}', '${title}', '${journal}', ${year}, '${authors}', '${disease}', '${intervention}', ${sampleSize}, '${design}', '${outcome}', '${assertion}', ${confidence}, '${trial.extractedAt}'\n`;
    sql += `);\n\n`;

    // Multi-task Entities
    trial.multiTaskGraph?.entities?.forEach(e => {
      sql += `INSERT OR REPLACE INTO trial_entities (entity_id, pmid, entity_type, entity_label, entity_text, confidence) VALUES ('${e.id}-${pmid}', '${pmid}', '${e.type}', '${escapeSql(e.label)}', '${escapeSql(e.text)}', ${e.confidence});\n`;
    });

    // Multi-task Relations
    trial.multiTaskGraph?.relations?.forEach(r => {
      sql += `INSERT OR REPLACE INTO trial_relations (relation_id, pmid, relation_type, source_entity, target_entity, confidence) VALUES ('${r.id}-${pmid}', '${pmid}', '${r.type}', '${escapeSql(r.sourceText)}', '${escapeSql(r.targetText)}', ${r.confidence});\n`;
    });

    sql += `\n`;
  });

  return sql;
}

export function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(trials) {
  const headers = [
    'PMID', 'Title', 'Journal', 'Year', 'Target Disease', 'Intervention / Drug', 'Sample Size (N)', 'Study Design', 'Primary Outcome', 'Assertion Status', 'Confidence Score (%)'
  ];

  const rows = trials.map(t => [
    t.pmid,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.journal || '').replace(/"/g, '""')}"`,
    t.year || 2024,
    `"${(t.extracted.disease || '').replace(/"/g, '""')}"`,
    `"${(t.extracted.intervention || '').replace(/"/g, '""')}"`,
    t.extracted.sampleSize,
    `"${(t.extracted.studyDesign || '').replace(/"/g, '""')}"`,
    `"${(t.extracted.primaryOutcome || '').replace(/"/g, '""')}"`,
    t.extracted.assertionStatus,
    t.extracted.overallConfidence
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, 'clinical_trials_extracted.csv', 'text/csv;charset=utf-8;');
}

export function exportToJSON(trials) {
  const jsonContent = JSON.stringify(trials, null, 2);
  downloadFile(jsonContent, 'clinical_trials_extracted.json', 'application/json');
}

export function exportToSQLiteDB(trials) {
  const ddlContent = generateSQLiteDDL(trials);
  downloadFile(ddlContent, 'clinical_trials.sql', 'application/sql');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}
