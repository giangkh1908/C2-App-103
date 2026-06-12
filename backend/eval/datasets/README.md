# Evaluation Datasets

This directory contains test datasets for evaluating AI agent responses.

## Structure

```
datasets/
├── math/                  # Math problem datasets
│   ├── grade1.json       # Grade 1 problems
│   ├── grade2.json       # Grade 2 problems
│   ├── grade3.json       # Grade 3 problems
│   ├── grade4.json       # Grade 4 problems
│   └── grade5.json       # Grade 5 problems
└── responses/            # Expected responses
    └── templates.json    # Response templates
```

## Dataset Format

Each dataset file follows this format:

```json
{
  "version": "1.0",
  "grade": 2,
  "topic": "multiplication",
  "problems": [
    {
      "id": "mult_001",
      "question": "3 × 4 = ?",
      "context": "3 plates with 4 candies each",
      "expected_answer": 12,
      "difficulty": "easy",
      "visual_type": "candy",
      "hints": [
        "Think of 3 groups of 4",
        "4 + 4 + 4 = ?"
      ]
    }
  ]
}
```

## Usage

Run evaluation with:
```bash
cd backend
python eval/scripts/run_eval.py --dataset eval/datasets/math/grade2.json
```
