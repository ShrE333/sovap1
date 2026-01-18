
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for PDF generation)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose FastAPI port (Render will override this)
EXPOSE 10000

# Use shell form of CMD to allow environment variable expansion
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}
