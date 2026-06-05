# Prompt Crossword — Version 2

A 9×9 criss-cross crossword generator with prompt-driven topic, 5 difficulty levels, clue style selector, Netlify Function scaffold for LLM-generated clues, and local fallback word bank.

## Run locally without Netlify

```bash
cd crossword_v2_netlify
python3 -m http.server 8000
```

Open `http://localhost:8000`.

This uses fallback words because the Netlify Function is not running.

## Run locally with Netlify Functions

```bash
npm install -g netlify-cli
netlify dev
```

## Configure OpenAI in Netlify

Add environment variable:

```text
OPENAI_API_KEY=your_key_here
```

Optional:

```text
OPENAI_MODEL=gpt-4o-mini
```

## Deploy

Deploy the whole folder to Netlify. Share the single public site URL. Visitors generate fresh puzzles on demand from that same URL.
