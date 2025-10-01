#!/bin/bash

echo "🚀 Local Coffee Shops Part 2 - Testing Script"
echo "================================================="

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
else
    echo "❌ PostgreSQL is not installed"
    exit 1
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw local_coffee_shops; then
    echo "✅ Database 'local_coffee_shops' exists"
else
    echo "🔧 Creating database 'local_coffee_shops'..."
    createdb local_coffee_shops
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up database
echo "🗄️ Setting up database..."
npm run setup-db

# Start server in background
echo "🌐 Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test API endpoints
echo "🧪 Testing API endpoints..."

echo "Testing /api/coffeeshops..."
if curl -s http://localhost:3000/api/coffeeshops | jq . > /dev/null 2>&1; then
    echo "✅ API endpoint working"
else
    echo "❌ API endpoint failed"
fi

echo "Testing specific coffee shop..."
if curl -s "http://localhost:3000/api/coffeeshops/Brewed%20Awakening" | jq . > /dev/null 2>&1; then
    echo "✅ Specific shop endpoint working"
else
    echo "❌ Specific shop endpoint failed"
fi

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID

echo ""
echo "🎉 Testing complete!"
echo "To run the application:"
echo "1. npm start"
echo "2. Open http://localhost:3000 in your browser"
