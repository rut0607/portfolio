const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('⚠️ Supabase connection warning:', error.message);
      console.log('This is normal if the table does not exist yet.');
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
  }
};

// Run connection test if not in test environment
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = supabase;