#!/bin/bash

# Setup Script for Google Maps Integration
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh

echo "🚀 Setting up Google Maps Integration..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required (current: $(node -v))"
    exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Copy environment template
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created - Please edit with your credentials"
else
    echo "⚠️  .env file already exists - skipping"
fi
echo ""

# Generate encryption key
echo "🔐 Generating encryption key..."
node scripts/generate-encryption-key.js
echo ""

# Check Redis connection
echo "🔌 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis not responding - make sure it's running"
        echo "   Start with: redis-server"
    fi
else
    echo "⚠️  redis-cli not found - install Redis or configure remote connection"
fi
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
echo ""

# Run tests
echo "🧪 Running tests..."
npm test
if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "⚠️  Some tests failed - review and fix"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Firebase and Google credentials"
echo "2. Deploy Firestore rules: firebase deploy --only firestore:rules"
echo "3. Deploy Firestore indexes: firebase deploy --only firestore:indexes"
echo "4. Start backend: npm start"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "🎉 Happy coding!"
