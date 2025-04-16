require('dotenv').config();
const axios = require('axios');

const testKhaltiKey = async () => {
  const testPayload = {
    return_url: "http://localhost:3000/payment-success",
    website_url: "http://localhost:3000",
    amount: 1000, // 10 rupees in paisa
    purchase_order_id: `TEST-${Date.now()}`,
    purchase_order_name: "Test Order"
  };

  try {
    const response = await axios.post(
      'https://dev.khalti.com/api/v2/epayment/initiate/',
      testPayload,
      {
        headers: {
          Authorization: `Key key_test_48dc30c618424d9d9149ee6c999cf9f7`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Key is valid. Payment URL:', response.data.payment_url);
  } catch (err) {
    if (err.response) {
      console.error('❌ API Error:', err.response.data);
    } else {
      console.error('❌ Request failed:', err.message);
    }
  }
};

testKhaltiKey();
