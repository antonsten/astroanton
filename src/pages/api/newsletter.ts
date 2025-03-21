import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const email = data.email;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(
                JSON.stringify({
                    message: 'Please provide a valid email address'
                }), 
                { status: 400 }
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

        const response = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe?api_key=${CONVERTKIT_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            throw new Error(responseData.message || 'Failed to subscribe');
        }

        return new Response(
            JSON.stringify({
                message: 'Successfully subscribed to the newsletter!'
            }), 
            { status: 200 }
        );
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while subscribing. Please try again later.';
        return new Response(
            JSON.stringify({
                message: errorMessage
            }), 
            { status: 500 }
        );
    }
} 