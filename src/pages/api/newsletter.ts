import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'Newsletter API is running'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('Received newsletter subscription request');
    const data = await request.json();
    const email = data.email;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Invalid email format:', email);
      return new Response(
        JSON.stringify({
          message: 'Please provide a valid email address'
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const CONVERTKIT_API_KEY = import.meta.env.CONVERTKIT_API_KEY;
    const FORM_ID = import.meta.env.CONVERTKIT_FORM_ID;

    if (!CONVERTKIT_API_KEY || !FORM_ID) {
      console.error('Missing environment variables:', {
        hasApiKey: !!CONVERTKIT_API_KEY,
        hasFormId: !!FORM_ID
      });
      throw new Error('ConvertKit configuration is missing');
    }

    console.log('Attempting to subscribe with:', {
      formId: FORM_ID,
      apiKeyLength: CONVERTKIT_API_KEY.length
    });

    const response = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email: email
      })
    });

    const responseData = await response.json();
    console.log('ConvertKit API response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });

    if (!response.ok) {
      console.error('ConvertKit API error details:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      throw new Error(responseData.message || `Failed to subscribe: ${response.status} ${response.statusText}`);
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully subscribed to the newsletter!'
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while subscribing. Please try again later.';
    return new Response(
      JSON.stringify({
        message: errorMessage
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}; 