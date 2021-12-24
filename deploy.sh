#!/usr/bin/env bash

helm upgrade --install joovy charts/joovy -n ${NAMESPACE} -f - <<EOF
image:
  repository: "${REPOSITORY}"
  tag: "${TAG}"

envConfig: |
  TOKEN: "${TOKEN}"
  APPLICATION_ID: "${APPLICATION_ID}"
  TEST_GUILD_ID: "${TEST_GUILD_ID}"

resources:
  requests:
    memory: "80Mi"
    cpu: "10m"
  limits:
    memory: "512Mi"
    cpu: "2000m"
EOF