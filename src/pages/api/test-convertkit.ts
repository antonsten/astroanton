import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    try {
        const CONVERTKIT_API_KEY = import.meta.env.CONVERTKIT_API_KEY;
        const FORM_ID = import.meta.env.CONVERTKIT_FORM_ID;

        console.log('Testing ConvertKit credentials:', {
            hasApiKey: !!CONVERTKIT_API_KEY,
            hasFormId: !!FORM_ID,
            formId: FORM_ID,
            apiKeyLength: CONVERTKIT_API_KEY?.length
        });

        // First, try to get the form details
        const formResponse = await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}?api_key=${CONVERTKIT_API_KEY}`);
        const formData = await formResponse.text();
        console.log('Form details response:', formData);

        return new Response(
            JSON.stringify({
                message: 'Test completed',
                formResponse: formData
            }), 
            { 
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Test error:', error);
        return new Response(
            JSON.stringify({
                message: 'Test failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
} 