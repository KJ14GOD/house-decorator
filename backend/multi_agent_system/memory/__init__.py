"""
Memory system for the multi-agent interior design system.
Provides Neo4j-based memory storage and retrieval for user preferences.
"""

from .neo4j import get_driver, test_connection, close_driver
from .schemas import *
from .relationships import *
from .operations import MemoryNodeOperations, MemoryRelationshipOperations, MemoryQueryOperations, MemoryActionOps
from .chat_learning import ChatLearning
from .preference_evolution import PreferenceEvolution
from .memory_retrieval import MemoryRetrieval

__all__ = [
    'get_driver',
    'test_connection', 
    'close_driver',
    'MemoryNodeOperations',
    'MemoryRelationshipOperations',
    'MemoryQueryOperations',
    'MemoryActionOps',
    'ChatLearning',
    'PreferenceEvolution',
    'MemoryRetrieval'
]