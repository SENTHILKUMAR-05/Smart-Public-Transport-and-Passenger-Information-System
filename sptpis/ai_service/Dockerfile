# ==============================================================================
# Dockerfile: Python AI Analytics & RAG Microservice
# ==============================================================================
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and trained ML models
COPY . ./

ENV PORT=5001
EXPOSE 5001

CMD ["python", "app.py"]
