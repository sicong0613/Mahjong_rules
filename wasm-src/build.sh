#!/bin/bash
# Requires Emscripten SDK (emcc in PATH) — tested with emscripten/emsdk:3.1.64
# Output: ../data/fan_calculator.js + ../data/fan_calculator.wasm

emcc fan_calculator.cpp embind_wrapper.cpp \
  -I . \
  -O2 \
  --bind \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=MahjongCalculator \
  -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o ../data/fan_calculator.js
