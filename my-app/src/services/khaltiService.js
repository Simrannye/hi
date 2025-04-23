import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const initiateKhaltiPayment = async (paymentData) => {
  try {
    // Ensure all required fields are present according to Khalti docs
    const requiredFields = [
      'return_url', 'website_url', 'amount', 
      'purchase_order_id', 'purchase_order_name'
    ];
    
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    console.log('Initiating payment with data:', paymentData);
    
    const response = await axios.post(`${API_URL}/api/khalti/initiate`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    console.log('Payment initiation successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error initiating Khalti payment:', error);
    
    if (error.response) {
      console.error('Server response:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        throw new Error('Payment authentication failed. Please contact support with the error code: KH-AUTH-401');
      } else if (error.response.status === 503) {
        throw new Error('Payment service is currently unavailable. Please try again later or use Cash on Delivery.');
      } else {
        throw new Error(`Payment error (${error.response.status}): ${error.response.data.message || 'Unknown server error'}`);
      }
    } else if (error.request) {
      throw new Error('No response from the payment server. Please check your connection or try Cash on Delivery.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

export const verifyKhaltiPayment = async (pidx) => {
  const response = await axios.post('http://localhost:5000/api/khalti/verify', { pidx });
  return response.data;
};






