#!/bin/sh
set -e

mkdir -p /home/src_yankee/.n8n

cat > /tmp/credentials.json <<EOF
[
  {
    "id": "41xuS6HMVz5ZwsAI",
    "name": "Postgres account",
    "type": "postgres",
    "data": {
      "host": "postgres",
      "port": 5432,
      "database": "voltops",
      "user": "voltops",
      "password": "voltops",
      "ssl": "disable",
      "sshTunnel": false
    }
  },
  {
    "id": "ABNg4809pQO60C7R",
    "name": "Google Gemini(PaLM) Api account",
    "type": "googlePalmApi",
    "data": {
      "apiKey": "${GEMINI_API_KEY:-}"
    }
  },
  {
    "id": "mtBaX7qKmU8H6OQZ",
    "name": "Groq account",
    "type": "groqApi",
    "data": {
      "apiKey": "${GROQ_API_KEY:-}"
    }
  }
]
EOF

echo "Importing n8n credentials..."
    n8n import:credentials --input=/tmp/credentials.json --overwrite || n8n import:credentials --input=/tmp/credentials.json || true

echo "Importing n8n workflows..."
for workflow in /import/workflows/*.json; do
  echo "  $workflow"
  n8n import:workflow --input="$workflow" --overwrite || n8n import:workflow --input="$workflow" || true
done

echo "Publishing workflows so executeWorkflow can call them..."
for id in \
  lCMOXATTxS4k7Dup \
  o3ULi4E5Tyc6mShn \
  W0kbSjS9geQMq4nM \
  YkK1KmYPB6lDmZ0U \
  damAaJeRrATu9EzB \
  rvcl1AOx0vQnaUJj \
  6k6GS8emcQqwTrXl \
  OiN3e9JpCadTE7un \
  XUVkqUN00VgsNhQW
do
  echo "  publish $id"
  n8n publish:workflow --id="$id" || true
done

echo "Starting n8n..."
exec /docker-entrypoint.sh
