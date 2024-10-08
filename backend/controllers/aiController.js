// not working, might delete later
import axios from 'axios';

export const generateText = async (req, res) => {
    try {
        console.log('Making request with prompt:', req.body.prompt);
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model:  "gpt-4o", // or 'gpt-4' depending on your access
            prompt: req.body.prompt,
            max_tokens: 100,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'accept': 'application/json',
                'content-type': 'application/json'
            },
        });

        return response.data.choices[0].text;
    } catch (error) {
        console.error('Error generating text:', error);
    }
};
