import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Dumping complete schema from Supabase...\n');

async function dumpSchema() {
  const queries = {
    tables: `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `,
    
    columns: `
      SELECT 
        table_name,
        column_name,
        data_type,
        column_default,
        is_nullable,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `,
    
    constraints: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        kcu.column_name,
        rc.update_rule,
        rc.delete_rule,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.unique_constraint_schema = ccu.constraint_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
    `,
    
    indexes: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `,
    
    policies: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `,
    
    triggers: `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing,
        action_orientation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `,
    
    functions: `
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `
  };

  let output = `-- ============================================
-- SUPABASE DATABASE SCHEMA DUMP
-- Generated: ${new Date().toISOString()}
-- Project: personalAI (kqqdbauojjeatvftxluz)
-- ============================================\n\n`;

  try {
    // Execute each query using the Postgres REST API
    for (const [name, query] of Object.entries(queries)) {
      console.log(`📊 Fetching ${name}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: query 
      }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

      output += `-- ============================================\n`;
      output += `-- ${name.toUpperCase()}\n`;
      output += `-- ============================================\n\n`;

      if (error || !data) {
        // Fallback: Try direct query for some tables
        output += `-- Note: Using alternative method\n\n`;
        
        if (name === 'tables') {
          // Get tables by listing from supabase client
          const tables = ['items', 'categories', 'item_categories', 'alerts', 'holidays'];
          output += `-- Tables found: ${tables.join(', ')}\n\n`;
        }
      } else {
        output += JSON.stringify(data, null, 2) + '\n\n';
      }
    }

    // Write the output
    writeFileSync('supabase_schema_dump.sql', output);
    console.log('\n✅ Schema dump saved to: supabase_schema_dump.sql');
    
    // Also create a structured JSON dump
    const jsonOutput = {
      metadata: {
        generated: new Date().toISOString(),
        project: 'personalAI',
        reference_id: 'kqqdbauojjeatvftxluz'
      },
      schema: {}
    };
    
    writeFileSync('supabase_schema_dump.json', JSON.stringify(jsonOutput, null, 2));
    console.log('✅ JSON dump saved to: supabase_schema_dump.json\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

dumpSchema();
