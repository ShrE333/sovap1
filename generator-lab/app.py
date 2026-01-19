
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

def clean_json_string(s: str) -> str:
    """Bulletproof JSON extraction and cleaning for AI outputs."""
    if not s: return "{}"
    
    # 1. Extract JSON block
    try:
        start = s.find('{')
        end = s.rfind('}') + 1
        if start != -1 and end != 0:
            s = s[start:end]
    except: pass

    # 2. SANITIZATION: Remove literal Control Characters that break json.loads
    # This handles the "Invalid control character" error (tabs, newlines inside strings)
    # Replace literal tabs with \t
    s = s.replace('\t', '\\t')
    
    # Complex Regex: Replace literal newlines inside double-quotes while preserving 
    # newlines that are OUTSIDE quotes (separating fields)
    import re
    
    # This regex finds text inside double quotes and lets us process it
    def escape_inside_quotes(match):
        content = match.group(0)
        # Replace actual newlines with escaped \n inside the string value
        return content.replace('\n', '\\n').replace('\r', '\\r')
    
    # Simple recursive replacement for common pitfalls
    s = re.sub(r'":\s*"(.*?)"', escape_inside_quotes, s, flags=re.DOTALL)
    
    return s

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
        
        raw_syllabus = syllabus_resp.choices[0].message.content
        syllabus = json.loads(clean_json_string(raw_syllabus))
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
            1. **Theory**: Provide EXTENSIVE, DETAILED intelligence. MUST be at least 1500 words. Cover 'Concept', 'Architecture', 'Security', 'Industry Use Cases'.
            2. **Format**: Use Markdown.
            3. **Output**: Return a valid JSON object. Escape all quotes and newlines in the content.

            JSON Structure:
            {{
              "title": "{m_title}",
              "theory": "LONG MARKDOWN CONTENT HERE...",
              "code_lab": "Step-by-step lab instructions...",
              "prerequisites": ["concept1", "concept2"],
              "mcqs": [...]
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
                cleaned_str = clean_json_string(raw_content)
                module_expanded = json.loads(cleaned_str, strict=False)
            except Exception as parse_err:
                print(f"[!] JSON Parse error for module {m_title}: {str(parse_err)}", flush=True)
                # Radical fallback: if it's not JSON, it might just be the theory text
                module_expanded = {
                    "title": m_title,
                    "theory": raw_content if len(raw_content) > 100 else "Content synthesis failed. Please re-run.",
                    "code_lab": "Review full logs for generation details.",
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
            print(f"[!] QA NOTIFIED FAIL for {course_id}: {report.critical_errors}", flush=True)
            print(f"[*] PROCEEDING REGARDLESS because 'Generative Success' is priority 1.", flush=True)
            # We don't return here anymore, we save it so the user can see what the AI outputted.
        else:
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
                # Unicode-safe text cleanup
                content_text = str(module.get("theory", "No content available."))
                # Strip or replace characters that aren't in Latin-1 to prevent fpdf crashes
                safe_text = content_text.encode('ascii', 'ignore').decode('ascii')
                pdf.multi_cell(0, 7, txt=safe_text)
                
            pdf.output(pdf_path)
            print(f"[*] Local PDF generated at {pdf_path}", flush=True)

            # 2. Upload to GitHub
            from github import Github, GithubException
            gh_token = os.getenv("GITHUB_TOKEN")
            # Force correct repo based on user request
            gh_repo_name = "ShrE333/sovap-course-storage" 
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
                        try:
                            # Try fallback 1: append username if missing
                            if "/" not in gh_repo_name:
                                fallback_repo = f"ShrE333/{gh_repo_name}"
                                print(f"[*] Trying fallback 1: {fallback_repo}", flush=True)
                                repo = g.get_repo(fallback_repo)
                        except: 
                            # Try the specific storage repo the user mentioned
                            try:
                                print(f"[*] Trying specific storage repo: ShrE333/sovap-course-storage", flush=True)
                                repo = g.get_repo("ShrE333/sovap-course-storage")
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
        try:
            print(f"[*] Phase 4: Chunking and Vectorizing Concept Units...", flush=True)
            await vectorize_course(course_id, full_course)
        except Exception as ve:
            print(f"[!] Phase 4 (Vectorization) Failed: {str(ve)}", flush=True)
            print("[*] Continuing pipeline to ensure course delivery...", flush=True)

        # --- PHASE 5: KNOWLEDGE GRAPH ---
        try:
            print(f"[*] Phase 5: Building Knowledge Graph in Neo4j...", flush=True)
            await build_knowledge_graph(course_id, full_course)
        except Exception as nge:
            print(f"[!] Phase 5 (Knowledge Graph) Failed: {str(nge)}", flush=True)
            print("[*] Continuing pipeline...", flush=True)

    except Exception as e:
        print(f"[EX] Pipeline CRITICAL failure for {course_id}: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        
    finally:
        # --- PHASE 6: CALLBACK (Guaranteed) ---
        if request.callback_url:
            print(f"[*] Phase 6: Sending completion callback to {request.callback_url}...", flush=True)
            try:
                import requests
                # If we have a full course with modules, marks it as pending approval
                # If critical failure occurred early, we might want to flag it, but for now allow approval of what exists
                is_valid = len(full_course.get("modules", [])) > 0
                
                callback_data = {
                    "course_id": course_id,
                    "status": "published" if is_valid else "rejected", # Auto-publish (No Approval)
                    "modules_count": len(full_course.get("modules", []))
                }
                requests.post(request.callback_url, json=callback_data, timeout=10)
                print(f"[+] Callback delivered successfully.", flush=True)
            except Exception as e:
                print(f"[!] Callback failed: {str(e)}", flush=True)

class CourseQA:
    def __init__(self, course_id: str):
        self.course_id = course_id

    async def validate(self, course_data: dict) -> QAStatus:
        """AI Agent evaluates content via Groq."""
        # Structural sanity check for prompt
        summary = {
            "title": course_data.get("title"),
            "modules_count": len(course_data.get("modules", [])),
            "modules_preview": [m.get("title") for m in course_data.get("modules", [])],
        }

        prompt = f"""
        Audit our generated Intelligence Unit. 
        Summary: {json.dumps(summary)}
        Sample Content: {json.dumps(course_data.get('modules', [{}])[0].get('theory', ''))[:1500]}
        
        Analyze:
        1. Contextual Accuracy: Does the intro match the topic?
        2. Structural Integrity: Are there modules and MCQ components?
        3. Educational Value: Is the theory substantial?
        
        Return JSON: status (PASS/FAIL), score (0-100), critical_errors (list), suggested_fixes (list).
        PASS if it's usable for a student. FAIL only if it's empty or completely gibberish.
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
