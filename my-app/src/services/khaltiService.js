import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const initiateKhaltiPayment = async (paymentData) => {
  try {
    console.log('Initiating payment with data:', paymentData);
    
    // Add a timeout to prevent long waits when server is down
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
      // The request was made but no response was received
      throw new Error('No response from the payment server. Please check your connection or try Cash on Delivery.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

export const verifyKhaltiPayment = async (pidx) => {
  try {
    const response = await axios.post(`${API_URL}/api/khalti/verify`, { pidx });
    return response.data;
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);
    throw error;
  }
};