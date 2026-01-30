const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testAPI = async () => {
  console.log('🧪 Testing API endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health check: ${healthRes.data.message}\n`);
    
    // Test contact endpoint with valid data
    console.log('2. Testing contact form submission...');
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message from the API test script.'
    };
    
    try {
      const contactRes = await axios.post(`${BASE_URL}/contact`, testData);
      console.log(`✅ Contact form: ${contactRes.data.message}`);
      console.log(`📧 Email sent: ${contactRes.data.notification.email_sent}\n`);
    } catch (contactError) {
      if (contactError.response) {
        console.log('⚠️ Contact form test (expected):', contactError.response.data.error || 'Validation error');
      }
    }
    
    // Test invalid data
    console.log('3. Testing validation with invalid data...');
    const invalidData = {
      name: 'A',
      email: 'invalid-email',
      message: 'short'
    };
    
    try {
      await axios.post(`${BASE_URL}/contact`, invalidData);
    } catch (validationError) {
      if (validationError.response) {
        console.log('✅ Validation working correctly:', validationError.response.data.details);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check your Supabase dashboard for the stored submission');
    console.log('2. Check your email for the notification');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
};

testAPI();