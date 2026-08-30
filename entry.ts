import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch (e) { user = null; }

    const body = await req.json().catch(() => ({}));
    const question = (body.question || "").toString().trim();
    const projectId = (body.projectId || "").toString().trim();

    if (!question) return Response.json({ error: "Question is required" }, { status: 400 });

    // Gather portfolio context from entities (service role for read access)
    const projects = await base44.asServiceRole.entities.Project.list("-ai_risk_score", 60);
    const warnings = await base44.asServiceRole.entities.EarlyWarning.filter({ status: "Active" }, "-date", 30);

    let focusProject = null;
    let focusAssessment = null;
    if (projectId) {
      focusProject = await base44.asServiceRole.entities.Project.get(projectId);
      const assessments = await base44.asServiceRole.entities.RiskAssessment.filter({ project_id: projectId }, "-timestamp", 1);
      focusAssessment = assessments[0] || null;
    }

    const portfolioSummary = projects.slice(0, 50).map(p => ({
      code: p.project_code, name: p.name, sector: p.sector, ministry: p.ministry, state: p.state,
      original_cost: p.original_cost, revised_cost: p.revised_cost, expenditure: p.expenditure,
      physical_progress: p.physical_progress, financial_progress: p.financial_progress,
      time_overrun_months: p.time_overrun_months, cost_overrun: p.cost_overrun,
      risk_score: p.ai_risk_score, risk_level: p.risk_level
    }));

    const warningsSummary = warnings.map(w => ({
      project: w.project_name, type: w.warning_type, severity: w.severity, description: w.description, action: w.recommended_action
    }));

    const prompt = `You are NIRIKSHAN AI, an analytics copilot for infrastructure project monitoring. You analyze a portfolio of Indian infrastructure projects to identify cost overruns, delays, implementation bottlenecks, slow progress and high-risk projects.

Respond in this structured format:
**Key Insight:** <one concise insight>
**Supporting Indicators:** <2-4 bullet points with specific numbers/projects>
**Recommended Action:** <concrete next steps>

You are a decision-support tool. Be specific, cite project codes and numbers. If asked about a specific project, focus on it.

${focusProject ? `FOCUS PROJECT: ${JSON.stringify({ ...focusProject, assessment: focusAssessment })}` : ""}

PORTFOLIO DATA (JSON, ${portfolioSummary.length} projects):
${JSON.stringify(portfolioSummary)}

ACTIVE EARLY WARNINGS (JSON):
${JSON.stringify(warningsSummary)}

USER QUESTION: ${question}

Provide a focused, data-driven answer. Use ₹ and Cr for currency. Keep it under 200 words.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "automatic"
    });

    return Response.json({ answer: llmRes, question, contextCount: portfolioSummary.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}