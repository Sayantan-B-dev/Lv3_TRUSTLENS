# AI context and prompt contract

## Role of AI

AI is an **explainer**, not a detector or judge. The deterministic pipeline computes evidence and the risk class first. AI receives a compact evidence envelope and the already-computed assessment, then writes a human-readable explanation. It cannot add findings, change the class, or cite evidence that does not exist.

## Provider modes

| `AI_PROVIDER` | Behaviour |
| --- | --- |
| `auto` (default) | OpenAI-compatible provider if `AI_API_KEY` exists; otherwise deterministic |
| `none` | Always deterministic |
| `mock` | Local deterministic mock for development/tests |
| `openai` | OpenAI-compatible endpoint (`AI_BASE_URL`, `AI_MODEL`); missing key falls back |
| `deterministic` | Explicit deterministic fallback |

The product is fully usable with no key.

## Input envelope

The provider receives JSON containing:

- `target` (display-redacted), `input_type`
- risk `classification`, `score`, `coverage`, `confidence`, `ruleset_version`
- findings: `rule_id`, `severity`, `title`, `check_id`
- check summaries/status
- recommended actions and limitations
- allowed evidence IDs

Message text is not dumped raw into an instruction position. It is treated as untrusted data inside the evidence envelope.

## Output schema

```json
{
  "summary": "string",
  "why": [{ "claim": "string", "evidence_ids": ["check.id"] }],
  "next_steps": ["string"],
  "limitations": ["string"],
  "confidence_note": "string"
}
```

Validated by Pydantic. Every `evidence_ids` entry must exist in the current investigation's evidence set. A mismatch, malformed JSON, timeout, HTTP error, or missing provider triggers the deterministic explanation and is recorded as `mode: deterministic-fallback`.

## Prompt-injection rules

- Content inside the evidence envelope is data, never instructions.
- The model has no tools, no network access and no database access.
- The system prompt states that the risk class is fixed and must not be changed.
- The server never trusts model output as a security verdict; it only renders validated prose.
- Unknown evidence IDs are rejected even if the prose sounds plausible.

## Deterministic fallback

The fallback explanation is built from the risk assessment, top findings, coverage and limitations. It is labelled in the UI; users are never told an AI reviewed the case when it did not. `ai_used=false`, and `ai_explanation.mode` is `deterministic-fallback`.

## Privacy

- Do not send secrets or full personal data.
- `AI_MAX_INPUT_CHARS` caps prompt size.
- API keys live only in the server environment.
- Provider responses are not stored beyond the explanation payload.
- The explanation is advisory and should be read alongside evidence.

## Evaluation ideas

- Ask the model to explain a benign, suspicious and degraded case; verify every cited ID exists.
- Inject “ignore previous instructions” text into a message; confirm risk is unchanged and citations remain valid.
- Disable the provider mid-run; confirm fallback and no API error surfaced to the user.
- Compare explanations against the deterministic reasons for unsupported claims.
