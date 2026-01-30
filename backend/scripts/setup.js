const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up database tables...');
    
    // Read SQL schema
    const sqlPath = path.join(__dirname, '../sql/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error && !error.message.includes('already exists')) {
          console.warn('SQL execution warning:', error.message);
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    console.log('\n📊 To view and manage your data:');
    console.log(`1. Go to your Supabase dashboard: ${process.env.SUPABASE_URL}`);
    console.log('2. Navigate to the Table Editor');
    console.log('3. You should see "contact_submissions" table');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;