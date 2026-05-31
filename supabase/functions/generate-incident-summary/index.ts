import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeAlertForPrompt } from "../_shared/sanitize.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Alert {
  id: string;
  timestamp: string;
  source_system: string;
  alert_type: string;
  severity: string;
  raw_log: unknown;
  ai_analysis?: string;
  risk_score?: number;
}

function extractEntities(alerts: Alert[]) {
  const ips = new Set<string>();
  const users = new Set<string>();
  const assets = new Set<string>();
  alerts.forEach(a => {
    const log = (a.raw_log || {}) as Record<string, any>;
    if (log.source_ip) ips.add(log.source_ip);
    if (log.ip) ips.add(log.ip);
    if (log.affected_user) users.add(log.affected_user);
    if (log.username) users.add(log.username);
    if (log.affected_system) assets.add(log.affected_system);
    if (log.host) assets.add(log.host);
  });
  return { ips: [...ips], users: [...users], assets: [...assets] };
}

function computeConfidence(alerts: Alert[], entities: ReturnType<typeof extractEntities>) {
  let score = 0;
  if (alerts.length >= 3) score += 25;
  else if (alerts.length >= 2) score += 15;
  else score += 5;
  if (entities.ips.length > 0) score += 10;
  if (entities.users.length > 0) score += 10;
  if (entities.assets.length > 0) score += 10;
  const severities = new Set(alerts.map(a => a.severity));
  if (severities.has('Critical')) score += 15;
  else if (severities.has('High')) score += 10;
  score += Math.min(20, alerts.length * 5);
  score = Math.min(100, score);
  const interpretation = score >= 80 ? 'High confidence assessment' : score >= 50 ? 'Moderate confidence assessment' : 'Low confidence — limited data';
  return { score, interpretation };
}

function computeFP(alerts: Alert[], avgRisk: number) {
  if (alerts.length >= 3 && avgRisk >= 60) return { level: 'Low', rationale: 'Consistent multi-alert correlation with strong risk indicators.' };
  if (alerts.length >= 2 || avgRisk >= 50) return { level: 'Medium', rationale: 'Moderate correlation signals. Additional validation recommended.' };
  return { level: 'High', rationale: 'Insufficient corroborating evidence for definitive assessment.' };
}

// Determine correlation drivers from incident reason
function parseCorrelationMeta(incidentReason: string) {
  const driversMatch = incidentReason.match(/Drivers:\s*([^|]+)/);
  const ruleMatch = incidentReason.match(/Rule:\s*(\w+)/);
  const priorityMatch = incidentReason.match(/Priority:\s*(P\d)/);
  return {
    drivers: driversMatch ? driversMatch[1].trim().split(', ') : ['Auto-correlated'],
    triggerRule: ruleMatch ? ruleMatch[1] : 'auto_correlation',
    priority: priorityMatch ? priorityMatch[1] : null,
    cleanReason: incidentReason.split('|')[0].trim(),
  };
}

async function generateAISummary(
  alerts: Alert[],
  reason: string,
  severity: string,
  meta: ReturnType<typeof parseCorrelationMeta>,
  entities: ReturnType<typeof extractEntities>,
): Promise<{ summary: string; ai_used: boolean }> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  const riskScores = alerts.filter(a => a.risk_score != null).map(a => a.risk_score as number);
  const avgRisk = riskScores.length > 0 ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 50;
  const confidence = computeConfidence(alerts, entities);
  const fp = computeFP(alerts, avgRisk);

  const correlationEvidence = `
CORRELATION EVIDENCE:
INCIDENT ORIGIN: Auto-generated
TRIGGER RULE: ${meta.triggerRule}
CORRELATION DRIVERS: ${meta.drivers.join(', ')}
CORRELATION SUMMARY: ${meta.cleanReason}
MATCHED ENTITIES: IPs: ${entities.ips.join(', ') || 'None'} | Users: ${entities.users.join(', ') || 'None'} | Assets: ${entities.assets.join(', ') || 'None'}
SUPPORTING ALERTS: ${alerts.length}

CONFIDENCE SCORE: ${confidence.score}%
CONFIDENCE INTERPRETATION: ${confidence.interpretation}

FALSE POSITIVE LIKELIHOOD: ${fp.level}
FALSE POSITIVE RATIONALE: ${fp.rationale}`;

  if (!lovableKey) {
    return { summary: generateFallbackSummary(alerts, reason, severity, meta, entities) + correlationEvidence, ai_used: false };
  }

  try {
    const alertsContext = alerts.map(a => {
      const sanitized = sanitizeAlertForPrompt(a);
      return {
        type: sanitized.alert_type,
        source: sanitized.source_system,
        severity: sanitized.severity,
        timestamp: sanitized.timestamp,
        raw_log: sanitized.raw_log,
        risk_score: a.risk_score,
      };
    });

    const prompt = `You are a senior SOC analyst. Provide a structured incident intelligence report.

IMPORTANT: Base analysis ONLY on factual technical indicators.

INCIDENT CONTEXT:
- Reason: ${meta.cleanReason}
- Severity: ${severity}
- Alert Count: ${alerts.length}
- Trigger Rule: ${meta.triggerRule}
- Correlation Drivers: ${meta.drivers.join(', ')}
- Average Risk Score: ${avgRisk}/100
- Matched IPs: ${entities.ips.join(', ') || 'None'}
- Matched Users: ${entities.users.join(', ') || 'None'}

CORRELATED ALERTS:
${JSON.stringify(alertsContext, null, 2)}

Provide report with these EXACT sections:

ATTACK PATTERN:
[Attack pattern, techniques, methods]

OBSERVED BEHAVIOR:
[What was actually observed in alert data]

BUSINESS IMPACT:
[Impact on operations, data, systems]

PRIORITY LEVEL:
[P1/P2/P3 with justification]

CONTAINMENT STEPS:
[Specific containment measures]

ANALYST RECOMMENDATION:
[Strategic recommendations]

Be specific, actionable, use SOC terminology.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert SOC analyst. Be concise, specific, actionable.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      return { summary: generateFallbackSummary(alerts, reason, severity, meta, entities) + correlationEvidence, ai_used: false };
    }

    const data = await response.json();
    const aiSummary = data.choices[0]?.message?.content;

    if (!aiSummary) {
      return { summary: generateFallbackSummary(alerts, reason, severity, meta, entities) + correlationEvidence, ai_used: false };
    }

    return { summary: aiSummary + '\n' + correlationEvidence, ai_used: true };
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return { summary: generateFallbackSummary(alerts, reason, severity, meta, entities) + correlationEvidence, ai_used: false };
  }
}

function generateFallbackSummary(
  alerts: Alert[],
  reason: string,
  severity: string,
  meta: ReturnType<typeof parseCorrelationMeta>,
  entities: ReturnType<typeof extractEntities>,
): string {
  const alertTypes = [...new Set(alerts.map(a => a.alert_type))].join(', ');
  const sources = [...new Set(alerts.map(a => a.source_system))].join(', ');
  const riskScores = alerts.filter(a => a.risk_score != null).map(a => a.risk_score as number);
  const avgRisk = riskScores.length > 0 ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 50;
  const priority = avgRisk > 90 ? 'P1 - Immediate response required' : avgRisk > 50 ? 'P2 - Urgent attention needed' : 'P3 - Standard response timeline';

  return `ATTACK PATTERN:
${meta.cleanReason}. ${alerts.length} correlated alert(s) of type: ${alertTypes}. Source: ${sources}.

OBSERVED BEHAVIOR:
${alerts.slice(0, 5).map(a => `- ${a.alert_type} from ${a.source_system} at ${a.timestamp}`).join('\n')}

BUSINESS IMPACT:
${severity === 'Critical' || severity === 'High'
    ? 'Potential significant impact on business operations. Immediate investigation required.'
    : 'Moderate potential impact. Monitor closely and investigate within standard SLA.'}

PRIORITY LEVEL:
${priority}

CONTAINMENT STEPS:
1. Isolate affected systems if ongoing attack is detected
2. Block suspicious IP addresses at firewall level
3. Reset credentials for any compromised accounts
4. Preserve logs and evidence for forensic analysis
5. Monitor for lateral movement indicators

ANALYST RECOMMENDATION:
Review all ${alerts.length} correlated alerts. Average risk score: ${avgRisk}/100. Escalate to Tier 2/3 if attack pattern suggests APT.

[Rule-based analysis — AI temporarily unavailable]
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleData } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
    if (!roleData || (roleData.role !== 'analyst' && roleData.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Analyst access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { incidentId } = await req.json();
    if (!incidentId) {
      return new Response(JSON.stringify({ error: 'Missing incidentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: incident, error: incidentError } = await supabase
      .from('incidents').select('*').eq('id', incidentId).single();

    if (incidentError || !incident) {
      return new Response(JSON.stringify({ error: 'Incident not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if structured summary already exists
    const hasStructured = incident.ai_summary &&
      incident.ai_summary.includes("ATTACK PATTERN:") &&
      incident.ai_summary.includes("BUSINESS IMPACT:") &&
      incident.ai_summary.includes("CORRELATION EVIDENCE:");

    if (hasStructured) {
      return new Response(JSON.stringify({
        summary: incident.ai_summary,
        ai_used: !incident.ai_summary.includes('[Rule-based analysis'),
        cached: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch correlated alerts
    const { data: mappings } = await supabase
      .from('alert_incident_map').select('alert_id').eq('incident_id', incidentId);

    let alerts: Alert[] = [];
    if (mappings && mappings.length > 0) {
      const { data: alertData } = await supabase
        .from('alerts').select('*').in('id', mappings.map(m => m.alert_id));
      alerts = alertData || [];
    }

    const meta = parseCorrelationMeta(incident.incident_reason || '');
    const entities = extractEntities(alerts);

    console.log('Generating AI summary for incident:', incidentId);
    const { summary, ai_used } = await generateAISummary(
      alerts, incident.incident_reason || 'Unknown', incident.severity, meta, entities
    );

    await supabase.from('incidents').update({ ai_summary: summary }).eq('id', incidentId);

    return new Response(
      JSON.stringify({ summary, ai_used, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in generate-incident-summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
