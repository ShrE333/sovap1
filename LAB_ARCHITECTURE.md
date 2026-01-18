# SOVAP Course Generator Lab: Technical Specification

## Core System Architecture
The SOVAP platform is transitioning into an AI-native learning ecosystem composed of two primary layers:
1. **The Generator Lab (Python/FastAPI)**: Responsible for Phase 1-5 (PDF Generation, QA, Ingestion, Vectorization).
2. **The Adaptive Delivery Engine (Next.js)**: Responsible for Phase 0 and 6-9 (Pre-test, Delivery, RAG, Progress).

---

## Phase 0: The Diagnostic Baseline (Pre-Test)
**Objective**: Map student knowledge vs. confidence to build a custom roadmap.

### Logical Matrix
| Result | Confidence | Tag | Action |
| :--- | :--- | :--- | :--- |
| Correct | High | **Mastery** | Skip/Fast-track topic |
| Correct | Low | **Guess** | Reinforce with RAG examples |
| Incorrect | Low | **Unknown** | Standard learning path |
| Incorrect | High | **Misconception** | Gated "Unlearning" deep-dive |

### Data Structure (Supabase `enrollments` table)
```json
{
  "baseline_data": {
    "topic_scores": [
      { "topic_id": "string", "score": 0|1, "confidence": 1..5, "tag": "string" }
    ],
    "roadmap": [
      { "topic_id": "string", "priority": "high|med|low", "reason": "string" }
    ]
  }
}
```

---

## Phase 1: Course PDF Generation
**Objective**: Produce a 300-350 page verified educational document.

### Input Parameters
- `title`: Course name.
- `modules_count`: Number of modules.
- `labs_per_module`: Hands-on exercises.
- `mcqs_per_module`: Fixed at 70 for pool selection.

### LLM Pipeline (Groq / LLaMA 3)
1. **Outline Generation**: Hierarchical syllabus (Prerequisite-aware).
2. **Content expansion**: Deep theory, real-world examples, and code blocks.
3. **Assessment Generation**: 70 distinct MCQs per module.
4. **PDF Assembly**: Conversion of Markdown to formal PDF via Python libraries.

### Storage Strategy
- **Relational Metadata (Supabase)**: Stores `course_id`, `title`, and `teacher_id`.
- **Actual Content (GitHub)**: Stores the massive `master.json` and `source.pdf` in a dedicated repository.
- **Vector Chunks (Qdrant)**: Stores semantic embeddings for RAG.
- **Pathing**: `github.com/{repo}/courses/{course_id}/master.json`

---

## Phase 9: DEPLOYMENT
### Course Generator Lab
- **Containerization**: Dockerized for consistent environment.
- **Service**: Python FastAPI.
- **Hosting**: Railway or any Docker-ready cloud.
- **Interface**: Admin-only REST API for background course generation.

---

## Technical Stack (Mandatory)
- **Groq LLM**: Generation.
- **PyMuPDF**: Parsing.
- **Qdrant**: Vector storage.
- **Neo4j**: Knowledge Graph.
- **GitHub**: Object storage (JSON/PDF).
- **Railway**: Service deployment.
- **FastAPI**: Backend processor.
- **Docker**: Containerization.
