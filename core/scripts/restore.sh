#!/usr/bin/env bash

set -e

DUMP_FILE='dumpV1.txt'
HOST='http://localhost:3000/graphql'

echo "Restoring: ${DUMP_FILE} to: ${HOST}"

DUMP_FILE_DATA=$(cat $DUMP_FILE)
MUTATION="mutation {restoreV1(restore: $DUMP_FILE_DATA)}"
QUERY=$(jq -n --arg mutation "$MUTATION" '{query: $mutation}')

curl $HOST \
  -f \
  -H 'Content-Type: application/json' \
  --data-raw "$QUERY" \
  --compressed

echo "Database restored!"
