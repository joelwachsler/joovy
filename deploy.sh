#!/usr/bin/env bash

helm upgrade --install joovy charts/joovy -n ${NAMESPACE} -f - <<EOF
image:
  repository: "${REPOSITORY}"
  tag: "${TAG}"

resources:
  requests:
    memory: "80Mi"
    cpu: "10m"
  limits:
    memory: "512Mi"
    cpu: "2000m"
EOF