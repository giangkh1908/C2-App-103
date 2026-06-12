# Evaluation Scripts

Scripts for running AI agent evaluations.

## Scripts

### run_eval.py

Main evaluation runner.

```bash
python eval/scripts/run_eval.py --dataset <path> [--model <model>] [--verbose]
```

**Arguments:**
- `--dataset`: Path to dataset JSON file
- `--model`: LLM model to use (default: gpt-4o-mini)
- `--verbose`: Print detailed output
- `--output`: Output file for results (default: stdout)

**Example:**
```bash
python eval/scripts/run_eval.py --dataset eval/datasets/math/grade2.json --verbose
```

### analyze_results.py

Analyze evaluation results.

```bash
python eval/scripts/analyze_results.py --results <path>
```

## Output Format

Evaluation results follow this format:

```json
{
  "model": "gpt-4o-mini",
  "dataset": "grade2.json",
  "total": 50,
  "correct": 45,
  "accuracy": 0.90,
  "avg_response_time_ms": 1200,
  "details": [
    {
      "problem_id": "mult_001",
      "expected": 12,
      "actual": 12,
      "correct": true,
      "response_time_ms": 1100
    }
  ]
}
```
