async function categorizeDocumentContent(
  content: string
): Promise<{ topic: string; project: string; team: string }> {
  const VALID_TOPICS = [
    "Quarterly Review",
    "New Product Launch",
    "Client Case Study",
    "Branding Guidelines",
    "Internal Operations",
    "Budget & Finance",
    "Uncategorized",
  ];
  const VALID_PROJECTS = [
    "Q4 Strategy 2024",
    "Website Relaunch",
    "Client XYZ Campaign",
    "Internal Audit",
    "Brand Book Update",
    "N/A",
  ];
  const VALID_TEAMS = [
    "Creative",
    "Sales",
    "Data & Analytics",
    "Product Marketing",
    "Executive",
    "Operations",
    "External",
  ];

  const systemPrompt = `You are an expert document categorizer for a marketing firm. Analyze the provided document text and assign it a single 'topic', 'project' name, and 'team'. 
    
    You MUST select values ONLY from these predetermined lists:
    - Topic: ${VALID_TOPICS.join(", ")}. If none apply, use 'Uncategorized'.
    - Project: ${VALID_PROJECTS.join(", ")}. If none apply, use 'N/A'.
    - Team: ${VALID_TEAMS.join(", ")}.
    
    Always respond with the requested JSON structure only.`;

  const contentSnippet = content.substring(0, 4000);

  const userQuery = `Categorize the following document text. Be creative if the project or team is implied: \n\n--- DOCUMENT TEXT SNIPPET ---\n\n${contentSnippet}`;

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          // Update descriptions to remind the model of the allowed values
          topic: {
            type: "STRING",
            description: `The main subject. Must be one of: ${VALID_TOPICS.join(
              ", "
            )}`,
          },
          project: {
            type: "STRING",
            description: `The specific project. Must be one of: ${VALID_PROJECTS.join(
              ", "
            )}`,
          },
          team: {
            type: "STRING",
            description: `The primary team. Must be one of: ${VALID_TEAMS.join(
              ", "
            )}`,
          },
        },
        required: ["topic", "project", "team"],
      },
    },
  };

  // Exponential backoff for API call
  let response;
  let categoryData = { topic: "Uncategorized", project: "N/A", team: "Operations" };
  for (let i = 0; i < 3; i++) {
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          // Attempt to parse the JSON text received from the model
          try {
            categoryData = JSON.parse(jsonText) as {
              topic: string;
              project: string;
              team: string;
            };
            console.log("LLM Categorization Result:", categoryData);
          } catch (parseError) {
            console.error(
              "Failed to parse JSON from LLM:",
              jsonText,
              parseError
            );
            // Fallback to defaults if parsing fails
          }
        }
        break; // Exit loop on success or if a result was obtained
      }
    } catch (error) {
      console.warn(
        `Attempt ${i + 1} failed (Fetch Error), retrying in ${Math.pow(
          2,
          i
        )}s...`
      );
      if (i < 2)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
    }
  }

  return categoryData;
}