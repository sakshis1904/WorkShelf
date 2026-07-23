#!/bin/bash

echo "========================================="
echo "WorkShelf - Restart and Test"
echo "========================================="
echo ""

# Kill existing Next.js process
echo "1. Stopping existing Next.js server..."
pkill -f "next dev" || echo "   No existing server found"
sleep 2

# Run tests
echo ""
echo "2. Running system tests..."
export $(cat .env.local | grep -v '^#' | xargs)
node src/scripts/test-document-processing.mjs

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed! Check your .env.local file and credentials."
    exit 1
fi

echo ""
echo "========================================="
echo "✅ All systems ready!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Open http://localhost:3000"
echo ""
echo "3. Upload a document and watch the terminal for:"
echo "   [process-document] logs showing progress"
echo ""
echo "4. Check the Documents page to see status change"
echo "   from 'processing' to 'ready'"
echo ""
echo "========================================="
