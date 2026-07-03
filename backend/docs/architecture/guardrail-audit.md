# Guardrail Audit

## Overview

The backend guardrail pipeline has two layers:

| Layer | File | Purpose |
| --- | --- | --- |
| Input guard | `src/agents/guardrails.py` | Block unsafe or out-of-scope user messages before the LLM runs. |
| Output guard | `src/services/output_guard.py` | Validate assistant output before it is returned to the student. |

`src/services/learning_core.py` integrates both layers:

- Calls `guard_message(...)` before any LLM request.
- Calls `validate_assistant_output(...)` after the LLM/tool path produces an answer.
- Records `guardrail_blocks_total` only for input-stage blocks.
- Persists blocked/fallback responses through the same session pipeline.

## Input Guard Contracts

| Priority | Category | Trigger | Severity | log_reason | Covered by |
| --- | --- | --- | --- | --- | --- |
| 1 | `prompt_injection` | Keyword phrases | `high` | `prompt_injection_phrase_detected` | `backend/tests/agents/test_guardrails.py` |
| 2 | `greeting` | Short greeting heuristic | `low` | `greeting_short_circuit` | `backend/tests/agents/test_guardrails.py` |
| 3 | `gibberish` | Single-token / filler heuristic | `medium` | `gibberish_detected` | `backend/tests/agents/test_guardrails.py` |
| 4 | `abusive_or_profanity` | Keyword phrases | `medium` | `abusive_language_detected` | `backend/tests/agents/test_guardrails.py` |
| 5 | `unsafe_personal_request` | Keyword phrases | `high` | `personal_data_request_detected` | `backend/tests/agents/test_guardrails.py` |
| 6 | `non_math` | Keyword phrases | `medium` | `non_math_scope_detected` | `backend/tests/agents/test_guardrails.py` |

## Output Guard Contracts

| Check | Trigger | Purpose | Covered by |
| --- | --- | --- | --- |
| `non_empty` | Heuristic | Reject blank assistant output. | `backend/tests/unit/test_output_guard.py` |
| `pii_or_secret` | Regex | Reject email, phone, token-like strings. | `backend/tests/unit/test_output_guard.py` |
| `meta_leak` | Keyword phrases | Reject prompt/tool/internal detail leaks. | `backend/tests/unit/test_output_guard.py` |
| `math_scope` | Keyword phrases | Reject non-math assistant output. | `backend/tests/unit/test_output_guard.py` |
| `arithmetic_consistency` | Regex | Reject inconsistent arithmetic statements. | `backend/tests/unit/test_output_guard.py` |
| `tool_data_consistency` | Heuristic | Reject multiplication/division answers that omit required tool results. | `backend/tests/unit/test_output_guard.py` |

## Integration Notes

- Input-stage guard blocks now persist with `response_source="fallback"` because the LLM never ran.
- Input-stage guard metadata should include:
  - `guardrail`
  - `guardrail_reason`
  - `guardrail_severity`
  - `guardrail_stage`
- Output-stage guard does not hard-block the pipeline today.
  - It logs `output_validation_failed`.
  - It falls back to `build_contextual_explanation(...)`.
  - It annotates `agent_metadata["output_guard"]` for downstream inspection.

## Current Risk Labels

### False positives

- `greeting` is still heuristic and may short-circuit very short math-adjacent phrases if they are not explicit enough.
- `non_math` remains keyword-based, so ambiguous educational phrases may be classified too aggressively.

### False negatives

- Input guard remains phrase-based and may miss novel prompt-injection wording.
- Output guard does not yet validate all topic-specific reasoning, only arithmetic and required tool-result mentions for selected topics.

### Encoding / normalization

- Vietnamese normalization is now centralized in `src/agents/guardrail_text.py`.
- Older mojibake-sensitive normalization logic should not be reintroduced into `guardrails.py` or tests.

### Maintainability / testing

- Contracts are now explicit in `src/agents/guardrail_contracts.py`.
- Input and output guard order can be asserted directly in tests instead of inferred from long `if` chains.
- Pipeline behavior should continue to be covered by `backend/tests/unit/test_learning_core_guardrails.py`.
