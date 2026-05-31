import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateConnectionUrl(url: string): { valid: boolean; error?: string } {
  try {
    if (!url || typeof url !== 'string') return { valid: false, error: 'Connection URL is required' };
    // Accept postgres:// or postgresql:// schemes
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
      return { valid: false, error: 'URL must start with postgres:// or postgresql://' };
    }
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).single();
    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, connection_url, connection_id, name, alerts_table_name, sync_interval_minutes } = body;

    if (action === 'test') {
      // Test connection
      const validation = validateConnectionUrl(connection_url);
      if (!validation.valid) {
        return new Response(JSON.stringify({ success: false, error: validation.error }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let client: PgClient | null = null;
      try {
        client = new PgClient(connection_url);
        await client.connect();
        const result = await client.queryObject('SELECT 1 as test');
        await client.end();
        return new Response(JSON.stringify({ success: true, message: 'Connection successful' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        if (client) try { await client.end(); } catch {}
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Connection failed: ${err.message}` 
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'save') {
      const validation = validateConnectionUrl(connection_url);
      if (!validation.valid) {
        return new Response(JSON.stringify({ success: false, error: validation.error }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Test first
      let client: PgClient | null = null;
      let testPassed = false;
      try {
        client = new PgClient(connection_url);
        await client.connect();
        await client.queryObject('SELECT 1');
        await client.end();
        testPassed = true;
      } catch (err) {
        if (client) try { await client.end(); } catch {}
      }

      // Save connection (URL stored as-is; in production use vault)
      const { data, error } = await adminClient.from('db_connections').insert({
        name: name || 'External Database',
        connection_url_encrypted: connection_url,
        status: testPassed ? 'connected' : 'failed',
        last_tested_at: new Date().toISOString(),
        last_error: testPassed ? null : 'Connection test failed',
        alerts_table_name: alerts_table_name || 'alerts',
        sync_interval_minutes: sync_interval_minutes || 5,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, connection: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!connection_id) {
        return new Response(JSON.stringify({ error: 'connection_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await adminClient.from('db_connections').delete().eq('id', connection_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle') {
      if (!connection_id) {
        return new Response(JSON.stringify({ error: 'connection_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: conn } = await adminClient.from('db_connections').select('is_active').eq('id', connection_id).single();
      const { error } = await adminClient.from('db_connections').update({ is_active: !conn?.is_active }).eq('id', connection_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, is_active: !conn?.is_active }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: test, save, delete, toggle' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('db-connect error:', err);
    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
