# Qorgan backend + real-time detection (YOLO). Build from repository root.
FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY . /app

WORKDIR /app/apps/backend

ENV PYTHONUNBUFFERED=1
ENV QORGAN_PROFILE=centers

EXPOSE 5001

CMD ["python3", "app.py"]
