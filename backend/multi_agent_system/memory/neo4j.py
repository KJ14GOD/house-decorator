from neo4j import GraphDatabase
import os
from typing import Optional

# Neo4j connection configuration
NEO4J_URI = os.getenv('NEO4J_URI', 'neo4j://127.0.0.1:7687')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'Carrom12')

# Create driver instance
_driver = None

def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
            encrypted=False,
            trust="TRUST_ALL_CERTIFICATES"
        )
    return _driver

# Test connection function
def test_connection() -> bool:
    print(f'Attempting to connect to Neo4j with URI: {NEO4J_URI}')
    print(f'Username: {NEO4J_USERNAME}')
    print(f'Password set: {bool(NEO4J_PASSWORD)}')
    
    driver = get_driver()
    
    try:
        with driver.session() as session:
            result = session.run('RETURN "Connection successful" as message')
            record = result.single()
            print(f'Neo4j connection test: {record["message"]}')
            return True
    except Exception as error:
        print(f'Neo4j connection failed: {error}')
        return False

# Close driver connection
def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None