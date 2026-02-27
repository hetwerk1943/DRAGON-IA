FROM python:3.12-slim

ARG SERVICE_NAME
WORKDIR /app

COPY ${SERVICE_NAME}/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ${SERVICE_NAME} ./${SERVICE_NAME}

ENV SERVICE_NAME=${SERVICE_NAME}
EXPOSE 8000

CMD ["sh", "-c", "uvicorn ${SERVICE_NAME}.main:app --host 0.0.0.0 --port 8000"]
