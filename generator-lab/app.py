
import os
import json
import uuid
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

# Initialize Clients
app = FastAPI(title="SOVAP Course Generator Lab")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Vector DB Client
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"), 
    api_key=os.getenv("QDRANT_API_KEY")
) if os.getenv("QDRANT_URL") else None

# R2 Client Configuration (Boto3 is S3 compatible, used for R2)
def get_r2_client():
    if not os.getenv("R2_ACCESS_KEY_ID"):
        return None
    return boto3.client(
        's3',
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        region_name="auto"
    )

class QAStatus(BaseModel):
    status: str # PASS | FAIL
    score: int
    critical_errors: List[str]
    suggested_fixes: List[str]

class CourseRequest(BaseModel):
    title: str
    target_level: str = "Beginner"
    modules_count: int = 5
    labs_per_module: int = 1
    mcqs_per_module: int = 70

@app.post("/generate")
async def start_generation(request: CourseRequest, background_tasks: BackgroundTasks):
    course_id = f"COURSE-{uuid.uuid4().hex[:6].upper()}"
    background_tasks.add_task(generate_pipeline, course_id, request)
    
    return {
        "status": "QUEUED",
        "course_id": course_id,
        "message": f"Generation for '{request.title}' started via LLaMA 3 (Groq)."
    }

async def generate_pipeline(course_id: str, request: CourseRequest):
    print(f"[*] Starting pipeline for {course_id}: {request.title}")
    
    try:
        # --- PHASE 1.1: SYLLABUS GENERATION ---
        print(f"[*] Phase 1.1: Generating high-level Syllabus...")
        syllabus_prompt = f"Create a detailed syllabus for '{request.title}'. Return JSON with list of {request.modules_count} modules, each with 3 subtopics."
        
        syllabus_resp = client.chat.completions.create(
            messages=[{"role": "user", "content": syllabus_prompt}],
            model="llama3-70b-8192",
            response_format={"type": "json_object"}
        )
        syllabus = json.loads(syllabus_resp.choices[0].message.content)
        
        # --- PHASE 1.2: DEPTH EXPANSION (Recursive) ---
        full_course = {"course_id": course_id, "title": request.title, "modules": []}
        
        for i, module in enumerate(syllabus.get("modules", [])):
            print(f"[*] Expanding Module {i+1}: {module['title']}...")
            module_prompt = f"Write deep educational theory, a code lab, and {request.mcqs_per_module} MCQs for the module: {module['title']}. Topics: {module.get('subtopics', [])}"
            
            chunk_resp = client.chat.completions.create(
                messages=[{"role": "user", "content": module_prompt}],
                model="llama3-70b-8192",
                response_format={"type": "json_object"}
            )
            module_expanded = json.loads(chunk_resp.choices[0].message.content)
            full_course["modules"].append(module_expanded)

        # --- PHASE 2: AI QA AGENT ---
        print(f"[*] Phase 2: Running AI QA Agent...")
        qa_agent = CourseQA(course_id)
        report = await qa_agent.validate(full_course)
        
        if report.status == "FAIL":
            print(f"[!] QA FAILED for {course_id}. Errors: {report.critical_errors}")
            return

        print(f"[+] QA PASSED for {course_id} with score {report.score}/100")

        # --- PHASE 3: STORAGE (Cloudflare R2) ---
        print(f"[*] Phase 3: Storing course in Cloudflare R2...")
        r2 = get_r2_client()
        if r2:
            r2.put_object(
                Bucket=os.getenv("R2_BUCKET_NAME"),
                Key=f"courses/{course_id}/master.json",
                Body=json.dumps(full_course),
                ContentType='application/json'
            )
            print(f"[+] Successfully stored to R2: courses/{course_id}/master.json")
        else:
            # Fallback for local dev/missing keys: save to local file
            os.makedirs(f"storage/{course_id}", exist_ok=True)
            with open(f"storage/{course_id}/master.json", "w") as f:
                json.dump(full_course, f)
            print(f"[!] R2 not configured. Saved locally to storage/{course_id}/master.json")

        # --- PHASE 4: VECTOR CHUNKING ---
        print(f"[*] Phase 4: Chunking and Vectorizing Concept Units...")
        await vectorize_course(course_id, full_course)

    except Exception as e:
        print(f"[EX] Pipeline failed for {course_id}: {str(e)}")

class CourseQA:
    def __init__(self, course_id: str):
        self.course_id = course_id

    async def validate(self, course_data: dict) -> QAStatus:
        """AI Agent evaluates content via Groq."""
        prompt = f"""
        Review the following course data for quality, accuracy, and completeness.
        Course Data: {json.dumps(course_data)[:2000]}... (truncated for prompt)
        
        Evaluate:
        1. Does it cover the topic comprehensively?
        2. Are MCQs clear and accurate?
        3. Are labs safe and executable?
        
        Return a JSON report with: status (PASS/FAIL), score (0-100), critical_errors (list), and suggested_fixes (list).
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            response_format={"type": "json_object"}
        )
        
        report_data = json.loads(chat_completion.choices[0].message.content)
        return QAStatus(**report_data)

async def vectorize_course(course_id: str, course_data: dict):
    """
    Implements Phase 4: Chunk by Concept Unit.
    Vectorizes theory into Qdrant using semantic markers.
    """
    if not qdrant_client:
        print("[!] Qdrant not configured. Skipping vectorization.")
        return

    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2') # Standard efficient embedder

    points = []
    for module in course_data.get("modules", []):
        module_title = module.get("title", "Unknown Module")
        theory = module.get("theory", "")
        
        # Split theory into paragraphs/concepts (Simplified concept unit logic)
        chunks = [c.strip() for c in theory.split("\n\n") if len(c.strip()) > 50]
        
        for idx, chunk in enumerate(chunks):
            embedding = model.encode(chunk).tolist()
            point_id = str(uuid.uuid4())
            
            points.append(models.PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "course_id": course_id,
                    "module": module_title,
                    "content": chunk,
                    "type": "theory",
                    "metadata": {
                        "chunk_index": idx,
                        "difficulty": "basic" # Default
                    }
                }
            ))

    # Batch upsert to Qdrant
    if points:
        qdrant_client.upsert(
            collection_name="sovap_concepts",
            points=points
        )
    
    print(f"[+] Phase 4: Vectorized {len(points)} concept units for {course_id}")


@app.get("/status/{course_id}")
async def get_status(course_id: str):
    return {"course_id": course_id, "mode": "R2_ACTIVE_STORAGE"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
