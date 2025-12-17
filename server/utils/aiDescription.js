/**
 * AI Description Generator
 * 
 * This utility generates engaging event descriptions using AI.
 * It uses a simple approach that can work with various AI APIs.
 * 
 * For production, you would integrate with:
 * - OpenAI API
 * - Anthropic Claude API
 * - Or any other LLM provider
 */

// Simple template-based description generator (fallback when no AI API is configured)
const generateTemplateDescription = (eventData) => {
  const { title, category, location, date, time } = eventData;
  
  const templates = {
    conference: `Join us for ${title}, an exciting conference bringing together industry leaders and innovators. Taking place at ${location}, this event promises insightful discussions, networking opportunities, and valuable takeaways for all attendees.`,
    
    workshop: `Ready to level up your skills? ${title} is a hands-on workshop designed to provide practical knowledge and real-world applications. Whether you're a beginner or looking to advance your expertise, this session at ${location} has something for everyone.`,
    
    social: `Get ready for ${title}! This social gathering at ${location} is the perfect opportunity to meet new people, make connections, and have a great time. Come as you are and leave with new friends!`,
    
    sports: `Calling all sports enthusiasts! ${title} is happening at ${location}. Whether you're competing or cheering from the sidelines, this event promises excitement, energy, and unforgettable moments.`,
    
    music: `Experience the magic of live music at ${title}! Join us at ${location} for an evening filled with incredible performances, great vibes, and musical memories that will last a lifetime.`,
    
    art: `Immerse yourself in creativity at ${title}. This artistic gathering at ${location} showcases talent, inspiration, and the power of creative expression. Perfect for art lovers and curious minds alike.`,
    
    food: `Foodies, rejoice! ${title} at ${location} is a culinary adventure you won't want to miss. From delicious tastings to cooking demonstrations, prepare your taste buds for an unforgettable experience.`,
    
    tech: `Dive into the future at ${title}! This tech event at ${location} features cutting-edge innovations, expert insights, and networking opportunities with fellow tech enthusiasts and industry professionals.`,
    
    business: `Elevate your professional journey at ${title}. This business event at ${location} brings together entrepreneurs, executives, and professionals for discussions on trends, strategies, and growth opportunities.`,
    
    other: `Don't miss ${title} at ${location}! This event promises an engaging experience with something special for everyone. Mark your calendar and join us for what's sure to be a memorable occasion.`
  };

  const baseDescription = templates[category] || templates.other;
  
  return baseDescription;
};

// AI-powered description generator (for when API keys are configured)
const generateAIDescription = async (eventData) => {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.log('No AI API key configured, using template generator');
    return generateTemplateDescription(eventData);
  }

  try {
    const { title, category, location, date, time, additionalContext } = eventData;
    
    const prompt = `Generate an engaging and professional event description for the following event:

Title: ${title}
Category: ${category}
Location: ${location}
Date: ${date}
Time: ${time}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Requirements:
- Write 2-3 paragraphs
- Be enthusiastic but professional
- Highlight what attendees will gain
- Include a call-to-action at the end
- Keep it under 250 words`;

    // This is a placeholder for actual API integration
    // In production, you would use the OpenAI SDK or fetch API
    
    // Example with fetch (uncomment and configure when API key is available):
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes engaging event descriptions.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
    */

    // For now, return template-based description
    return generateTemplateDescription(eventData);

  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to template
    return generateTemplateDescription(eventData);
  }
};

// Enhanced description with AI suggestions
const enhanceDescription = async (originalDescription, eventData) => {
  // If no AI API configured, return original
  if (!process.env.OPENAI_API_KEY) {
    return originalDescription;
  }

  try {
    const prompt = `Enhance and improve the following event description while keeping its core message:

Original: ${originalDescription}

Event Title: ${eventData.title}
Category: ${eventData.category}

Make it more engaging, professional, and compelling. Keep it under 300 words.`;

    // Placeholder for actual API call
    return originalDescription;

  } catch (error) {
    console.error('AI enhancement error:', error);
    return originalDescription;
  }
};

module.exports = {
  generateAIDescription,
  generateTemplateDescription,
  enhanceDescription
};
