import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Optional: target a specific connection
    let connectionFilter: string | null = null;
    try {
      const body = await req.json();
      connectionFilter = body?.connection_id || null;
    } catch { /* no body = process all */ }

    // Fetch active connections
    let query = adminClient.from('db_connections')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'connected');
    
    if (connectionFilter) {
      query = query.eq('id', connectionFilter);
    }

    const { data: connections, error: connError } = await query;
    if (connError) throw connError;
    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active connections', ingested: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalIngested = 0;
    const results: any[] = [];

    for (const conn of connections) {
      let pgClient: PgClient | null = null;
      try {
        pgClient = new PgClient(conn.connection_url_encrypted);
        await pgClient.connect();

        const tableName = conn.alerts_table_name || 'alerts';

        // Get already-ingested external alert IDs for this connection
        const { data: existingLogs } = await adminClient
          .from('external_alert_log')
          .select('external_alert_id')
          .eq('connection_id', conn.id);

        const existingIds = new Set((existingLogs || []).map((l: any) => l.external_alert_id));

        // Fetch alerts from external DB
        // Flexible: try common column patterns
        const queryResult = await pgClient.queryObject(`
          SELECT * FROM ${tableName} 
          ORDER BY COALESCE(timestamp, created_at, now()) DESC 
          LIMIT 100
        `);

        const newAlerts: any[] = [];
        for (const row of queryResult.rows as any[]) {
          const externalId = String(row.id || row.alert_id || row.uuid || crypto.randomUUID());
          if (existingIds.has(externalId)) continue;

          // Map external alert to ThreatLens schema
          const mappedAlert = {
            source_system: row.source_system || row.source || row.system || 'External DB',
            alert_type: row.alert_type || row.type || row.category || 'External Alert',
            severity: mapSeverity(row.severity || row.priority || 'Medium'),
            raw_log: row.raw_log || row.payload || row.data || row,
            status: 'New' as const,
            ai_used: false,
            timestamp: row.timestamp || row.created_at || new Date().toISOString(),
          };

          newAlerts.push({ externalId, mappedAlert });
        }

        // Insert new alerts
        for (const { externalId, mappedAlert } of newAlerts) {
          const { data: inserted, error: insertError } = await adminClient
            .from('alerts')
            .insert(mappedAlert)
            .select('id')
            .single();

          if (insertError) {
            console.error(`Failed to insert alert ${externalId}:`, insertError);
            continue;
          }

          // Log the ingestion
          await adminClient.from('external_alert_log').insert({
            connection_id: conn.id,
            external_alert_id: externalId,
            local_alert_id: inserted.id,
          });

          // Trigger AI analysis
          try {
            await fetch(`${supabaseUrl}/functions/v1/analyze-alert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ alert: { ...mappedAlert, id: inserted.id } }),
            });
          } catch (err) {
            console.error(`Failed to trigger analysis for ${inserted.id}:`, err);
          }

          totalIngested++;
        }

        // Update last sync
        await adminClient.from('db_connections').update({
          last_sync_at: new Date().toISOString(),
          last_error: null,
        }).eq('id', conn.id);

        await pgClient.end();
        results.push({ connection: conn.name, ingested: newAlerts.length, status: 'success' });

      } catch (err) {
        if (pgClient) try { await pgClient.end(); } catch {}
        console.error(`Error processing connection ${conn.id}:`, err);
        
        // Update connection status
        await adminClient.from('db_connections').update({
          last_error: err.message,
          status: 'failed',
        }).eq('id', conn.id);

        results.push({ connection: conn.name, error: err.message, status: 'failed' });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_ingested: totalIngested, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('ingest-external-alerts error:', err);
    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapSeverity(value: string): string {
  const v = String(value).toLowerCase();
  if (v === 'critical' || v === '1' || v === 'p1') return 'Critical';
  if (v === 'high' || v === '2' || v === 'p2') return 'High';
  if (v === 'low' || v === '4' || v === 'p4' || v === 'info') return 'Low';
  return 'Medium';
}
