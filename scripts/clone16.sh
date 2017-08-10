#!/usr/bin/env bash

# Exit on error
set -e

mkdir -p cloned
cd cloned

[ -d react16 ] || git clone https://github.com/facebook/react.git react16
cd react16
git reset --hard head
git checkout tags/16.0.0-beta.5
npm i
