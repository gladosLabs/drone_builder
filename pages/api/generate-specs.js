export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { prompt, model = 'openai' } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    let response;
    let specs;

    // Enhanced system prompt for drone specifications
    const systemPrompt = `You are an expert drone builder and engineer. Your task is to analyze user requirements and provide detailed drone specifications.

IMPORTANT: Provide a conversational, human-readable response first, then include the JSON specification at the end.

Your response should follow this structure:

1. **Greeting & Understanding**: Acknowledge their request and show you understand their needs
2. **Analysis**: Explain why you're recommending specific parts based on their requirements
3. **Detailed Recommendations**: For each major component, explain your choice with reasoning
4. **Performance Expectations**: What they can expect in terms of flight time, speed, payload, etc.
5. **Cost Breakdown**: Estimated total cost and any budget considerations
6. **Next Steps**: What they should do next

Make your response conversational, friendly, and educational. Use bullet points, bold text, and clear sections to make it easy to read.

At the very end, include the JSON specification in a code block for the system to parse.

Example response format:
"Great choice! Based on your requirements for a racing drone, here's what I recommend:

**Frame Selection:**
I'm recommending a 5-inch carbon fiber racing frame because it provides the perfect balance of strength and agility for high-speed flight.

**Motor & ESC Setup:**
For racing performance, you'll want 2207 2400KV motors paired with 40A ESCs. This combination delivers excellent thrust and responsiveness.

**Expected Performance:**
- Flight Time: 4-6 minutes
- Top Speed: 80-100 mph
- Estimated Cost: $400-600

The JSON specification for this build is:
\`\`\`json
{...}
\`\`\`"

User prompt: ${prompt}`;

    if (model === 'openai' && process.env.OPENAI_API_KEY) {
      // Try OpenAI first
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        response = data.choices[0].message.content;
        
        // Try to extract JSON specs from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            specs = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('Failed to parse JSON from OpenAI response');
          }
        }
      }
    }

    if (!response && model === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      // Try Anthropic as fallback
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nUser request: ${prompt}` }
          ]
        }),
      });

      if (anthropicResponse.ok) {
        const data = await anthropicResponse.json();
        response = data.content[0].text;
        
        // Try to extract JSON specs from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            specs = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('Failed to parse JSON from Anthropic response');
          }
        }
      }
    }

    if (!response) {
      // Fallback to local model or mock response
      response = `Perfect! I understand you're looking to build a drone. Based on your request: "${prompt}", here's my expert recommendation:

**🎯 Understanding Your Needs:**
I can see you're interested in building a drone that meets your specific requirements. Let me break down the best components for your needs.

**🏗️ Frame Selection:**
For your use case, I recommend a **5-inch carbon fiber racing frame**. This provides the perfect balance of:
- Excellent strength-to-weight ratio
- Durability for high-speed flight
- Optimal aerodynamics for performance

**⚡ Motor & ESC Setup:**
Your power system should include:
- **2207 2400KV brushless motors** - High KV for racing performance
- **40A BLHeli_32 ESCs** - Excellent thrust and responsiveness
This combination delivers the power and control you need for dynamic flight.

**🔋 Battery System:**
A **6S 1300mAh LiPo battery** offers:
- Optimal power-to-weight ratio
- Good flight time for your needs
- Reliable performance under load

**🧠 Flight Controller:**
The **F7 flight controller** with built-in PDB provides:
- Clean wiring and advanced features
- Excellent processing power
- Built-in power distribution

**🔄 Propellers:**
**5x4.5x3 tri-blade props** deliver:
- Maximum thrust and efficiency
- Excellent control response
- Optimal performance for your setup

**📊 Expected Performance:**
- **Flight Time:** 4-6 minutes
- **Top Speed:** 80-100 mph
- **Payload Capacity:** 500g
- **Estimated Cost:** $400-600

**💡 Next Steps:**
1. Review these recommendations
2. Click "Apply to New Build" to see this setup in the 3D playground
3. Customize any components as needed
4. Save your build when you're satisfied

The technical specification for this build is:
\`\`\`json
{
  "frame": {
    "type": "5-inch Racing Frame",
    "size": "5 inch",
    "material": "Carbon Fiber",
    "reasoning": "Optimal for racing with excellent strength-to-weight ratio"
  },
  "motors": {
    "type": "2207 Brushless",
    "kv": 2400,
    "size": "2207",
    "reasoning": "High KV for racing performance and excellent thrust"
  },
  "escs": {
    "type": "40A BLHeli_32",
    "current": "40A",
    "reasoning": "Sufficient current handling for high-performance motors"
  },
  "battery": {
    "type": "6S LiPo",
    "capacity": "1300mAh",
    "voltage": "22.2V",
    "reasoning": "Optimal power-to-weight ratio for racing"
  },
  "flightController": {
    "type": "F7 FC",
    "features": "Built-in PDB, advanced features",
    "reasoning": "Clean wiring and advanced flight modes"
  },
  "props": {
    "type": "Tri-blade",
    "size": "5x4.5",
    "pitch": "4.5",
    "reasoning": "Maximum thrust and efficiency for racing"
  },
  "estimatedCost": "$400-600",
  "estimatedFlightTime": "4-6 minutes",
  "estimatedPayload": "500g"
}
\`\`\``;

      // Extract the JSON from the mock response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          specs = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log('Failed to parse JSON from mock response');
        }
      }
    }

    return res.status(200).json({
      success: true,
      response: response,
      specs: specs
    });

  } catch (error) {
    console.error('Error generating specs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate specifications'
    });
  }
} 