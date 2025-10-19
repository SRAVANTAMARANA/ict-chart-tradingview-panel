FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed to build and run pyswisseph
RUN apt-get update && \
	apt-get install -y --no-install-recommends \
		build-essential \
		gcc \
		wget \
		ca-certificates \
		libssl-dev \
		libbz2-dev \
		liblzma-dev \
		zlib1g-dev \
		libsqlite3-dev \
		curl && \
	rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements (includes pyswisseph)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend to ensure detectors and app are available
COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
