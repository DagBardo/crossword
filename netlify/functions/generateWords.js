exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse(501, {
      error: "OPENAI_API_KEY is not configured.",
      entries: []
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const theme = String(body.theme || "general knowledge").slice(0, 120);
  const difficulty = Math.min(5, Math.max(1, Number(body.difficulty || 2)));
  const style = String(body.style || "learning").slice(0, 40);
  const maxWords = Math.min(18, Math.max(12, Number(body.maxWords || 18)));

  const system = `
You generate compact educational crossword content.

Return only valid JSON. No markdown.

Answers must:
- be single words
- use A-Z letters only
- be 3 to 9 letters long
- contain no spaces, hyphens, punctuation, or accents

For a 9x9 criss-cross grid:
- prefer 4 to 7 letter answers
- include many common crossing letters
- avoid too many 8 or 9 letter answers
- generate extra candidates so at least 8 can cross successfully

Difficulty:
1 = common answers, direct clues
2 = common answers, slightly indirect clues
3 = mixed common and specialized answers
4 = specialized answers, indirect clues
5 = obscure or expert-level answers, demanding clues

Each entry needs:
- answer
- clue
- note

The note should be a short educational explanation.
`;

  const user = {
    task: "Generate entries for a 9x9 criss-cross crossword.",
    theme,
    difficulty,
    style,
    count: maxWords,
    required_schema: {
      entries: [
        {
          answer: "WORD",
          clue: "brief clue",
          note: "brief educational note"
        }
      ]
    }
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const text = await response.text();

      return jsonResponse(502, {
        error: "OpenAI API error",
        detail: text.slice(0, 500)
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return jsonResponse(200, {
      entries: cleanEntries(parsed.entries || [])
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error.message
    });
  }
};

function cleanEntries(entries) {
  const seen = new Set();

  return entries
    .map(entry => ({
      answer: String(entry.answer || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, ""),
      clue: String(entry.clue || "").trim(),
      note: String(entry.note || "").trim()
    }))
    .filter(entry => entry.answer.length >= 3)
    .filter(entry => entry.answer.length <= 9)
    .filter(entry => entry.clue)
    .filter(entry => {
      if (seen.has(entry.answer)) return false;
      seen.add(entry.answer);
      return true;
    })
    .slice(0, 18);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
