#!/bin/bash

# Simple script to run local development server
# Choose the first available option

PORT=8000

echo "Starting local development server on port $PORT..."
echo "Open your browser to: http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server $PORT
# Fallback to Python 2
elif command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer $PORT
# Try Node.js http-server
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server -p $PORT
else
    echo "Error: No suitable server found."
    echo "Please install Python 3 or Node.js to run the development server."
    exit 1
fi
