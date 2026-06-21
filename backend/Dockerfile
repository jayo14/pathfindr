FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV SECRET_KEY_CHECK=required

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
HEALTHCHECK CMD python -c "import os; assert os.getenv('SECRET_KEY'), 'SECRET_KEY not set'"


CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
