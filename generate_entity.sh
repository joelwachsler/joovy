#!/usr/bin/env bash

echo "Regenerating entities..."

sea generate entity -o entity/src
cp entity/src/mod.rs entity/src/lib.rs

echo "Done!"
