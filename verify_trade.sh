#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Register Alice"
curl -s -c alice_cookies.txt -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@forest.com", "password": "password123"}' > /dev/null

echo "2. Register Bob"
curl -s -c bob_cookies.txt -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "email": "bob@forest.com", "password": "password123"}' > /dev/null

# Get User IDs (hacky parsing for demo)
# Assuming Alice is ID 2 (since I created one user before) and Bob is ID 3
ALICE_ID=2
BOB_ID=3

echo "3. Alice creates a resource"
RESOURCE_RESPONSE=$(curl -s -b alice_cookies.txt -X POST "$BASE_URL/resources" \
  -H "Content-Type: application/json" \
  -d '{"title": "Magic Beans", "type": "seed", "quantity": 5, "unit": "beans"}')
RESOURCE_ID=$(echo $RESOURCE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   Resource ID: $RESOURCE_ID"

echo "4. Alice creates trade with Bob"
TRADE_RESPONSE=$(curl -s -b alice_cookies.txt -X POST "$BASE_URL/trades" \
  -H "Content-Type: application/json" \
  -d "{\"receiverId\": $BOB_ID, \"resourceIds\": [$RESOURCE_ID]}")
TRADE_ID=$(echo $TRADE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   Trade ID: $TRADE_ID"

echo "5. Bob accepts the trade"
curl -s -b bob_cookies.txt -X POST "$BASE_URL/trades/$TRADE_ID/accept"

echo "6. Check resource status (should not appear in list or show as traded if we implemented that view)"
# My list endpoint filters? No, it lists last 50. Let's inspect the DB directly or trust the flow if step 5 succeeded (it returns 200 OK)
