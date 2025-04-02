import type { Handler } from '@netlify/functions';

const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the form data
    const formData = new URLSearchParams(event.body || '');
    const email = formData.get('email');

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    console.log('Attempting to subscribe email:', email);
    console.log('Using ConvertKit Form ID:', CONVERTKIT_FORM_ID);

    // Forward to ConvertKit
    const response = await fetch(`https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': CONVERTKIT_API_KEY || '',
      },
      body: JSON.stringify({
        email,
        form_id: CONVERTKIT_FORM_ID,
      }),
    });

    const responseData = await response.json();
    console.log('ConvertKit response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to subscribe to ConvertKit');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully subscribed to newsletter' }),
    };
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter',
        details: error instanceof Error ? error.stack : undefined
      }),
    };
  }
}; 