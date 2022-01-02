#!/usr/bin/env bash

set -e

DUMP_FILE='dumpV1.txt'
HOST='http://localhost:3000/graphql'

echo "Dumping database from: ${HOST}"

curl $HOST \
  -f \
  -H 'Content-Type: application/json' \
  --data-raw '{"query":"query{dumpV1}"}' \
  --compressed | jq .data.dumpV1 > $DUMP_FILE

echo "Dump written to: ${DUMP_FILE}"