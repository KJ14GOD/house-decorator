#!/usr/bin/env python3
"""
Simple test script for the multi-agent memory integration
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8001"
TEST_USER_ID = "test_user_123"

def test_memory_learning():
    """Test that memory learning works with the multi-agent system"""
    
    # Test room state
    room_state = {
        "width": 12,
        "length": 12,
        "height": 8,
        "floorColor": "#e3e3e3",
        "ceilingColor": "#e3e3e3", 
        "wallFrontColor": "#e3e3e3",
        "wallBackColor": "#e3e3e3",
        "wallLeftColor": "#e3e3e3",
        "wallRightColor": "#e3e3e3",
        "blocks": []
    }
    
    # Test requests that should trigger learning
    test_queries = [
        "I don't like blue walls",
        "I love warm colors like red and orange", 
        "Make the walls a nice green color",
        "What colors do I prefer?" # This should use memory
    ]
    
    print("🧪 Testing Multi-Agent Memory Integration")
    print("=" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Testing query: '{query}'")
        
        payload = {
            "user_input": query,
            "room_state": room_state,
            "userId": TEST_USER_ID
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/multi-agent-design",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {data['message'][:100]}...")
                print(f"   🤖 Agent: {data['agent_used']}")
                if data['actions']:
                    print(f"   ⚡ Actions: {len(data['actions'])} generated")
            else:
                print(f"   ❌ Error {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Connection error: {e}")
            return False
    
    return True

def test_neo4j_connection():
    """Test Neo4j connection from the memory module"""
    try:
        from memory.neo4j import test_connection
        print("\n🔗 Testing Neo4j Connection...")
        
        if test_connection():
            print("   ✅ Neo4j connection successful")
            return True
        else:
            print("   ❌ Neo4j connection failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing Neo4j: {e}")
        return False

def main():
    print("Multi-Agent Memory System Test")
    print("=" * 40)
    
    # Test 1: Neo4j Connection
    if not test_neo4j_connection():
        print("\n⚠️  Neo4j connection failed. Make sure Neo4j is running.")
        return
    
    # Test 2: Multi-agent memory integration
    print(f"\n🌐 Testing Multi-Agent API at {BASE_URL}")
    if test_memory_learning():
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Some tests failed.")

if __name__ == "__main__":
    main()