import { Platform } from 'react-native';

export class EmergencyResponse {
  constructor({
    emergencyType,
    severityLevel,
    immediateActions,
    actionsToAvoid,
    emergencyCallIndicators,
    monitoringAdvice,
    disclaimer,
    qaAnswer = null,
  }) {
    this.emergencyType = emergencyType;
    this.severityLevel = severityLevel;
    this.immediateActions = immediateActions || [];
    this.actionsToAvoid = actionsToAvoid || [];
    this.emergencyCallIndicators = emergencyCallIndicators || [];
    this.monitoringAdvice = monitoringAdvice || [];
    this.disclaimer = disclaimer || 'DISCLAIMER: Emergency guidance only.';
    this.qaAnswer = qaAnswer;
  }
}

export class FirstAidEngine {
  constructor() {
    this.modelSpec = null;
    this.isLoaded = false;
    this.isLoading = false;
  }

  async loadModel() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    try {
      // Direct require of Metro-bundled JSON model
      const rawModel = require('../../assets/ml/first_aid_mobile_model.json');
      const modelData = typeof rawModel === 'string' ? JSON.parse(rawModel) : rawModel;

      if (modelData) {
        this.modelSpec = modelData;
        this.isLoaded = true;
        this.isLoading = false;
        console.log('✅ Offline AI First Aid Model loaded! Vocab size:', this.modelSpec?.vocabulary_size);
        return;
      }
    } catch (e) {
      console.warn('First aid model load notice:', e);
    }

    this.isLoading = false;
  }

  preprocessQuery(queryText) {
    if (!queryText) return '';
    let q = queryText.toLowerCase();
    q = q
      .replace(/\bstomachpain\b/g, 'stomach pain')
      .replace(/\bstomachache\b/g, 'stomach ache')
      .replace(/\bbellyache\b/g, 'belly ache')
      .replace(/\bdogbite\b/g, 'dog bite')
      .replace(/\bcatbite\b/g, 'cat bite')
      .replace(/\bsnakebite\b/g, 'snake bite')
      .replace(/\bchestpain\b/g, 'chest pain')
      .replace(/\bheadache\b/g, 'head ache')
      .replace(/\bbackpain\b/g, 'back pain');
    return q.replace(/[^a-z0-9\s]/g, '');
  }

  predict(rawQuery) {
    if (!this.isLoaded || !this.modelSpec) return null;

    const query = this.preprocessQuery(rawQuery);
    const tokens = query.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return null;

    // 1. QA Index Similarity Search
    let bestQaScore = 0.0;
    let bestQaRecord = null;

    if (this.modelSpec.qa_index) {
      const qaIndex = this.modelSpec.qa_index;
      const qaRecords = qaIndex.qa_records || [];
      const vocab = qaIndex.vocabulary || {};
      const idfList = qaIndex.idf || [];

      const queryTermCounts = {};
      for (const t of tokens) {
        queryTermCounts[t] = (queryTermCounts[t] || 0) + 1;
      }

      const queryVec = {};
      let queryNorm = 0.0;
      Object.entries(queryTermCounts).forEach(([term, count]) => {
        if (vocab[term] !== undefined) {
          const idx = vocab[term];
          const tf = 1.0 + Math.log(count);
          const idf = idfList[idx] || 0.0;
          const weight = tf * idf;
          queryVec[idx] = weight;
          queryNorm += weight * weight;
        }
      });
      queryNorm = Math.sqrt(queryNorm);

      if (queryNorm > 0) {
        for (const rec of qaRecords) {
          const recQuestion = String(rec.question || '');
          const cleanRecQ = recQuestion.toLowerCase().replace(/[^a-z0-9\s]/g, '');
          const recTokens = cleanRecQ.split(/\s+/).filter((t) => t.length > 0);

          const recTermCounts = {};
          for (const t of recTokens) {
            recTermCounts[t] = (recTermCounts[t] || 0) + 1;
          }

          let dotProduct = 0.0;
          let docNorm = 0.0;

          Object.entries(recTermCounts).forEach(([term, count]) => {
            if (vocab[term] !== undefined) {
              const idx = vocab[term];
              const weight = (1.0 + Math.log(count)) * (idfList[idx] || 0.0);
              docNorm += weight * weight;
              if (queryVec[idx] !== undefined) {
                dotProduct += queryVec[idx] * weight;
              }
            }
          });
          docNorm = Math.sqrt(docNorm);

          if (docNorm > 0) {
            const cosSim = dotProduct / (queryNorm * docNorm);
            if (cosSim > bestQaScore) {
              bestQaScore = cosSim;
              bestQaRecord = rec;
            }
          }
        }
      }
    }

    // 2. Multi-Class Logistic Regression Classifier
    const vocab = this.modelSpec.vocabulary || {};
    const classes = this.modelSpec.classes || [];
    const coefs = this.modelSpec.coefficients || [];
    const intercepts = this.modelSpec.intercept || [];
    const idfList = this.modelSpec.idf || [];
    const kb = this.modelSpec.knowledge_base || {};

    const featureVector = new Array(Object.keys(vocab).length).fill(0.0);
    const termCounts = {};
    for (const t of tokens) {
      termCounts[t] = (termCounts[t] || 0) + 1;
    }

    Object.entries(termCounts).forEach(([term, count]) => {
      if (vocab[term] !== undefined) {
        const idx = vocab[term];
        if (idx < featureVector.length) {
          const tf = count / tokens.length;
          const idf = idfList[idx] || 0.0;
          featureVector[idx] = tf * idf;
        }
      }
    });

    let maxScore = -Infinity;
    let bestClassIndex = 0;

    for (let c = 0; c < classes.length; c++) {
      let score = Number(intercepts[c] || 0.0);
      const classCoefs = coefs[c] || [];
      for (let i = 0; i < featureVector.length; i++) {
        if (featureVector[i] !== 0.0) {
          score += featureVector[i] * Number(classCoefs[i] || 0.0);
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestClassIndex = c;
      }
    }

    let predictedCategory = String(classes[bestClassIndex] || 'First Aid');
    const entry = kb[predictedCategory] || null;

    let qaAnswer = null;
    if (bestQaScore >= 0.15 && bestQaRecord) {
      qaAnswer = bestQaRecord.answer;
      if (
        bestQaRecord.category &&
        bestQaRecord.category !== 'Doctor QA' &&
        bestQaRecord.category !== 'Clinical Consultation' &&
        bestQaRecord.category !== 'First Aid QA'
      ) {
        predictedCategory = bestQaRecord.category;
      }
    }

    return new EmergencyResponse({
      emergencyType: entry?.emergency_type || predictedCategory,
      severityLevel: entry?.severity_level || 'Urgent',
      immediateActions: entry?.immediate_actions || [],
      actionsToAvoid: entry?.actions_to_avoid || [],
      emergencyCallIndicators: entry?.emergency_call_indicators || [],
      monitoringAdvice: entry?.monitoring_advice || [],
      disclaimer:
        entry?.disclaimer ||
        'DISCLAIMER: This tool provides emergency first aid guidance only.',
      qaAnswer,
    });
  }
}
