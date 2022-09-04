#!/usr/bin/env bash

echo "Regenerating entities..."

sea generate entity -o entity/src
cp entity/src/mod.rs entity/src/lib.rs

echo "Updating derives..."
find entity/src -type f -name '*.rs' -exec sed 's/#\[derive(Clone, Debug, PartialEq, DeriveEntityModel)\]/#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]/' -i {} \;

echo "Done!"
