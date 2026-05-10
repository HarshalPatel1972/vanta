export const getContextualPrediction = async (
  sentence: string, 
  partial: string, 
  signal: AbortSignal
): Promise<string | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      signal,
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "Complete only the last word in this sentence. Return only the completed word, nothing else."
          },
          {
            role: "user",
            content: sentence
          }
        ],
        temperature: 0,
        max_tokens: 5
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const completion = data.choices[0]?.message?.content?.trim();
    
    if (completion && completion.toLowerCase().startsWith(partial.toLowerCase())) {
      return completion.slice(partial.length);
    }
    return null;
  } catch (err) {
    if ((err as any).name === "AbortError") return null;
    console.error("Groq error:", err);
    return null;
  }
};
