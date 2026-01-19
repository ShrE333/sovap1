
import os
import json
import uuid
import asyncio
import logging
import sys
import base64
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import AsyncGroq
from qdrant_client import QdrantClient
from qdrant_client.http import models
from neo4j import GraphDatabase

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Load .env only if it exists (for local dev)
if os.path.exists(".env"):
    load_dotenv()
else:
    print("[!] No .env file found, using system environment variables.")

print(f"[*] DEBUG: PORT from env is {os.getenv('PORT')}")
print(f"[*] DEBUG: GROQ_API_KEY present? {bool(os.getenv('GROQ_API_KEY'))}")

# Initialize Clients
app = FastAPI(title="SOVAP Course Generator Lab")

# Add CORS Middleware for Production Bridge
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sovap.in", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Defensive Client Initialization
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    logger.warning("GROQ_API_KEY not found. Course generation will fail.")
    client = None
else:
    client = AsyncGroq(api_key=groq_api_key)
    logger.info("AsyncGroq client initialized.")

# Vector DB Client
qdrant_url = os.getenv("QDRANT_URL")
qdrant_key = os.getenv("QDRANT_API_KEY")
if qdrant_url and qdrant_key:
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_key)
else:
    print("[!] WARNING: Qdrant configuration incomplete. Vectorizing will be skipped.")
    qdrant_client = None

# Global Embedding Model Singleton (To prevent OOM restarts on Render)
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        print("[*] Loading SentenceTransformer 'all-MiniLM-L6-v2' (Singleton)...", flush=True)
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _embedding_model

# Knowledge Graph Client (Neo4j)
class Neo4jHandler:
    def __init__(self):
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")
        self.driver = GraphDatabase.driver(uri, auth=(user, password)) if uri else None

    def close(self):
        if self.driver:
            self.driver.close()

    def add_dependency(self, course_id, concept, prerequisite):
        if not self.driver: return
        with self.driver.session() as session:
            session.execute_write(self._create_relationship, course_id, concept, prerequisite)

    @staticmethod
    def _create_relationship(tx, course_id, concept, prerequisite):
        query = (
            "MERGE (c:Concept {name: $concept, course_id: $course_id}) "
            "MERGE (p:Concept {name: $prerequisite, course_id: $course_id}) "
            "MERGE (p)-[:PREREQUISITE_OF]->(c)"
        )
        tx.run(query, concept=concept, prerequisite=prerequisite, course_id=course_id)

neo4j_handler = Neo4jHandler()

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
    course_id: str
    title: str
    description: str | None = None
    target_level: str = "Beginner"
    modules_count: int = 5
    labs_per_module: int = 1
    mcqs_per_module: int = 5 # Reduced for performance/cost during test
    callback_url: str | None = None

@app.get("/")
async def root():
    return {"status": "AI Course Generator Lab is ACTIVE", "version": "2.0.0"}

@app.get("/health")
async def health():
    groq_available = client is not None
    qdrant_available = qdrant_client is not None
    neo4j_available = neo4j_handler.driver is not None

    github_ok = False
    try:
        from github import Github
        gh_token = os.getenv("GITHUB_TOKEN")
        gh_repo = os.getenv("GITHUB_REPO", "ShrE333/sovap1")
        if gh_token and gh_repo:
            g = Github(gh_token)
            r = g.get_repo(gh_repo)
            github_ok = True
    except Exception: # Catch any exception during GitHub access
        github_ok = False

    return {
        "status": "UP",
        "groq": groq_available,
        "qdrant": qdrant_available,
        "neo4j": neo4j_available,
        "github": github_ok,
        "github_repo": os.getenv("GITHUB_REPO", "ShrE333/sovap1"),
        "port": os.getenv("PORT", "10000")
    }

@app.post("/generate")
async def generate_course(request: CourseRequest, background_tasks: BackgroundTasks):
    print(f"[*] Received request to generate course: {request.title} ({request.course_id})", flush=True)
    background_tasks.add_task(generate_pipeline, request.course_id, request)
    return {"message": "Generation started", "course_id": request.course_id}

@app.post("/generate-from-pdf")
async def generate_from_pdf(
    background_tasks: BackgroundTasks,
    course_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...)
):
    print(f"[*] PDF Received: {file.filename} for Course: {course_id}", flush=True)
    background_tasks.add_task(generate_pipeline, course_id, CourseRequest(course_id=course_id, title=title, description=f"PDF: {file.filename}"))
    return {"message": "PDF Processing started", "course_id": course_id}

async def generate_pipeline(course_id: str, request: CourseRequest):
    print(f"[*] STARTING PIPELINE for {course_id}: {request.title}", flush=True)
    
    if not client:
        print(f"[!] ERROR: Groq Client not initialized. Check GROQ_API_KEY.", flush=True)
        return

    try:
        # --- PHASE 1.1: SYLLABUS GENERATION ---
        print(f"[*] Phase 1.1: Generating high-level Syllabus for {request.title}...", flush=True)
        ctx = request.description if request.description and len(request.description) > 5 else f"A comprehensive course on {request.title}"
        syllabus_prompt = f"""
        You are an Lead Technical Instructor at a Top University. 
        Create a world-class, deep-dive syllabus for '{request.title}'. 
        Context: {ctx}. 
        The course must be rigorous, logical, and progress from fundamentals to advanced professional mastery.
        
        Return a JSON object with the following structure:
        {{
          "modules": [
            {{
              "title": "A compelling, academic module name",
              "subtopics": ["Subtopic 1: Fundamental concepts", "Subtopic 2: Advanced applications", "Subtopic 3: Professional best practices"]
            }}
          ]
        }}
        Generate exactly {request.modules_count} distinct and non-overlapping modules.
        """
        
        syllabus_resp = await client.chat.completions.create(
            messages=[{"role": "user", "content": syllabus_prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        syllabus = json.loads(syllabus_resp.choices[0].message.content)
        modules_list = syllabus.get("modules", [])
        print(f"[*] Syllabus generated with {len(modules_list)} modules.", flush=True)
        
        # --- PHASE 1.2: DEPTH EXPANSION (Recursive) ---
        full_course = {"course_id": course_id, "title": request.title, "modules": []}
        
        for i, module in enumerate(modules_list):
            m_title = module.get("title", f"Module {i+1}")
            print(f"[*] Expanding Module {i+1}: {m_title}...", flush=True)
            module_prompt = f"""
            You are a Lead Technical Instructor. Write an elite, high-quality intelligence unit for the module: {m_title}.
            Topics: {module.get('subtopics', [])}. 
            Overall Course Context: {ctx}.

            Instructions:
            1. **Theory**: Provide approx 800-1000 words of rich intelligence. Use Markdown (### headers, **bolding**). 
               Break it down into: 'Concept', 'Architecture', 'Security Implications', and 'Industry Implementation'.
            2. **Code Lab**: Provide a step-by-step hands-on laboratory exercise. 
            3. **Assessment**: Create exactly {request.mcqs_per_module} MCQs.

            CORE REQUIREMENT: You MUST return a JSON object. All long text fields must be valid JSON strings (properly escaped). 
            Do NOT include any text outside the JSON object.

            JSON Structure:
            {{
              "title": "{m_title}",
              "theory": "Markdown content here...",
              "code_lab": "Markdown content here...",
              "prerequisites": ["concept1", "concept2"],
              "mcqs": [
                {{
                  "question": "Question text",
                  "options": ["A", "B", "C", "D"],
                  "correctIndex": 0,
                  "difficulty": "basic",
                  "explanation": "Why it is correct"
                }}
              ]
            }}
            """
            
            # Use a more robust approach for long JSON content
            # We don't use response_format="json_object" here because it's too fragile for 1000+ word outputs on Groq/Llama
            chunk_resp = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a technical educator. Respond ONLY with a valid JSON object. No preamble."},
                    {"role": "user", "content": module_prompt}
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=3500
            )
            
            raw_content = chunk_resp.choices[0].message.content
            try:
                # Find start and end of JSON in case of preamble
                start = raw_content.find('{')
                end = raw_content.rfind('}') + 1
                json_str = raw_content[start:end] if (start != -1 and end != 0) else raw_content
                
                # SECURITY: Clean up potential invalid control characters that break json.loads
                # This handles cases where Llama puts literal newlines inside string values
                import re
                # We want to keep regular newlines if they are BETWEEN fields, 
                # but valid JSON strings (inside quotes) should have \n, not literal \n.
                # json.loads(..., strict=False) handles many control chars but not all.
                try:
                    module_expanded = json.loads(json_str, strict=False)
                except json.JSONDecodeError:
                    # If still failing, attempt radical cleaning
                    # Replace literal newlines inside strings or similar
                    # (This is a simplified approach)
                    module_expanded = json.loads(json_str.replace('\n', '\\n').replace('\r', '\\r'), strict=False)
                    
            except Exception as parse_err:
                print(f"[!] JSON Parse error for module {m_title}: {str(parse_err)}", flush=True)
                # Fallback: attempt to fix common issues or create a minimal valid module
                module_expanded = {
                    "title": m_title,
                    "theory": raw_content[:2000] if raw_content else "Content generation failed.", 
                    "code_lab": "Manual review required due to formatting error.",
                    "prerequisites": [],
                    "mcqs": []
                }
            
            full_course["modules"].append(module_expanded)
            
            # Memory Cleanup: Free up string memory after each step
            import gc
            gc.collect()

        # --- PHASE 2: AI QA AGENT ---
        print(f"[*] Phase 2: Running AI QA Agent...", flush=True)
        qa_agent = CourseQA(course_id)
        report = await qa_agent.validate(full_course)
        
        if report.status == "FAIL":
            print(f"[!] QA FAILED for {course_id}. Errors: {report.critical_errors}", flush=True)
            return

        print(f"[+] QA PASSED for {course_id} with score {report.score}/100", flush=True)

        # --- PHASE 3: STORAGE (GitHub) ---
        print(f"[*] Phase 3: Committing course to GitHub...", flush=True)
        
        try:
            # 1. Generate PDF
            pdf_path = f"storage/{course_id}/course.pdf"
            os.makedirs(f"storage/{course_id}", exist_ok=True)
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", size=12)
            pdf.cell(200, 10, txt=f"Course: {request.title}", ln=1, align='C')
            
            # Simple PDF content
            for module in full_course.get("modules", []):
                pdf.ln(10)
                pdf.set_font("helvetica", style="B", size=14)
                pdf.cell(0, 10, txt=f"Module: {module.get('title', 'Untitled')}", ln=1)
                pdf.set_font("helvetica", size=11)
                # Cleanup text for Latin-1 since default helvetica doesn't support full UTF-8
                content_text = str(module.get("content", "No content generated."))
                safe_text = content_text.encode('latin-1', 'replace').decode('latin-1')
                pdf.multi_cell(0, 7, txt=safe_text)
                
            pdf.output(pdf_path)
            print(f"[*] Local PDF generated at {pdf_path}", flush=True)

            # 2. Upload to GitHub
            from github import Github, GithubException
            gh_token = os.getenv("GITHUB_TOKEN")
            gh_repo_name = os.getenv("GITHUB_REPO", "ShrE333/sovap1") # Safer default
            gh_branch = os.getenv("GITHUB_BRANCH", "main")
            
            print(f"[*] Attempting GitHub commit to {gh_repo_name} on branch {gh_branch}...", flush=True)

            if gh_token and gh_repo_name:
                g = Github(gh_token)
                repo = None
                try:
                    repo = g.get_repo(gh_repo_name)
                    print(f"[+] Connected to repo: {gh_repo_name}", flush=True)
                except Exception as e:
                    print(f"[!] FAILED to get repo {gh_repo_name}: {str(e)}", flush=True)
                    # Try fallback 1: append username if missing
                    if "/" not in gh_repo_name:
                        try:
                            fallback_repo = f"ShrE333/{gh_repo_name}"
                            print(f"[*] Trying fallback 1: {fallback_repo}", flush=True)
                            repo = g.get_repo(fallback_repo)
                        except: pass
                    
                    # Try fallback 2: use the primary project repo confirmed in logs
                    if not repo:
                        try:
                            primary_repo = "ShrE333/sovap1"
                            print(f"[*] Trying fallback 2 (Primary): {primary_repo}", flush=True)
                            repo = g.get_repo(primary_repo)
                        except Exception as final_e:
                            print(f"[!!] ALL GITHUB FALLBACKS FAILED: {str(final_e)}", flush=True)
                            raise final_e
                
                # Helper to update or create
                def push_to_gh(path, message, content):
                    try:
                        try:
                            # Try to get existing file
                            contents = repo.get_contents(path, ref=gh_branch)
                            sha = contents.sha
                            repo.update_file(
                                path=path,
                                message=f"Update {message}",
                                content=content,
                                sha=sha,
                                branch=gh_branch
                            )
                            print(f"[*] GitHub Updated: {path}", flush=True)
                        except GithubException as e:
                            if e.status == 404:
                                repo.create_file(
                                    path=path,
                                    message=f"Create {message}",
                                    content=content,
                                    branch=gh_branch
                                )
                                print(f"[*] GitHub Created: {path}", flush=True)
                            else:
                                raise
                    except Exception as ge:
                        print(f"[!] Failed to push {path} to GitHub: {str(ge)}", flush=True)

                # Save JSON
                print(f"[*] Pushing master.json for {course_id}...", flush=True)
                push_to_gh(
                    f"courses/{course_id}/master.json",
                    f"master JSON for {course_id}",
                    json.dumps(full_course, indent=2)
                )
                
                # Save PDF
                with open(pdf_path, "rb") as f:
                    pdf_content = f.read()
                
                print(f"[*] Pushing source.pdf for {course_id}...", flush=True)
                push_to_gh(
                    f"courses/{course_id}/source.pdf",
                    f"course PDF for {course_id}",
                    pdf_content
                )
                
                print(f"[+] Successfully finished GitHub storage phase for {course_id}", flush=True)
            else:
                # Local Save Fallback
                with open(f"storage/{course_id}/master.json", "w") as f:
                    json.dump(full_course, f, indent=2)
                print(f"[!] GITHUB_TOKEN or REPO not set. Course saved locally in storage/{course_id}/", flush=True)
        except Exception as e:
            print(f"[GH-ERROR] Storage phase failed for {course_id}: {str(e)}", flush=True)

        # --- PHASE 4: VECTOR CHUNKING ---
        print(f"[*] Phase 4: Chunking and Vectorizing Concept Units...", flush=True)
        await vectorize_course(course_id, full_course)

        # --- PHASE 5: KNOWLEDGE GRAPH ---
        print(f"[*] Phase 5: Building Knowledge Graph in Neo4j...", flush=True)
        await build_knowledge_graph(course_id, full_course)

        # --- PHASE 6: CALLBACK ---
        if request.callback_url:
            print(f"[*] Phase 6: Sending completion callback to {request.callback_url}...", flush=True)
            try:
                import requests
                callback_data = {
                    "course_id": course_id,
                    "status": "pending_approval",
                    "modules_count": len(full_course.get("modules", []))
                }
                requests.post(request.callback_url, json=callback_data, timeout=10)
                print(f"[+] Callback delivered successfully.", flush=True)
            except Exception as e:
                print(f"[!] Callback failed: {str(e)}", flush=True)

    except Exception as e:
        print(f"[EX] Pipeline CRITICAL failure for {course_id}: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()

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
        
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
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

    model = get_embedding_model()

    points = []
    for module in course_data.get("modules", []):
        module_title = module.get("title", "Unknown Module")
        theory = module.get("theory", "")
        
        # Split theory into paragraphs/concepts (Simplified concept unit logic)
        chunks = [c.strip() for c in theory.split("\n\n") if len(c.strip()) > 50]
        
        for idx, chunk in enumerate(chunks):
            # Use singleton model for encoding
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


async def build_knowledge_graph(course_id: str, course_data: dict):
    """
    Implements Phase 5: Build a concept dependency graph.
    Extracts prerequisites from course structure and maps them in Neo4j.
    """
    if not neo4j_handler.driver:
        print("[!] Neo4j not configured. Skipping Knowledge Graph build.")
        return

    for module in course_data.get("modules", []):
        module_name = module.get("title")
        # LLM-generated modules should include a 'prerequisites' list
        prereqs = module.get("prerequisites", [])
        
        for prereq in prereqs:
            neo4j_handler.add_dependency(course_id, module_name, prereq)
            print(f"[*] Graph Edge: {prereq} -> PREREQUISITE_OF -> {module_name}")

    print(f"[+] Phase 5: Knowledge Graph constructed for {course_id}")


@app.get("/status/{course_id}")
async def get_status(course_id: str):
    github_repo = os.getenv("GITHUB_REPO", "NOT_SET")
    return {
        "course_id": course_id, 
        "storage_mode": "GITHUB",
        "repository": github_repo,
        "github_token_present": bool(os.getenv("GITHUB_TOKEN")),
        "message": "Check GitHub repository for course files."
    }

if __name__ == "__main__":
    import uvicorn
    # Render and other hosts provide a PORT environment variable
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
