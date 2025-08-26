from typing import Optional, Literal, Union, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

# Relationship type definitions for the User Memory Graph
# These relationships create the "telepathic" understanding

# Base relationship properties that all relationships share
RelationshipProperties = Dict[str, Any]

# Relationship type names for Neo4j
RELATIONSHIP_TYPES = {
    'FEELS_CALM_WITH': 'FEELS_CALM_WITH',
    'FEELS_ANXIOUS_WITH': 'FEELS_ANXIOUS_WITH',
    'FEELS_ENERGIZED_WITH': 'FEELS_ENERGIZED_WITH',
    'AVOIDS_DUE_TO': 'AVOIDS_DUE_TO',
    'ASPIRES_TO_FEEL': 'ASPIRES_TO_FEEL',
    'USES_FOR': 'USES_FOR',
    'CONFLICTS_WITH': 'CONFLICTS_WITH',
    'PREFERS': 'PREFERS',
    'EVOLVING_TOWARDS': 'EVOLVING_TOWARDS',
    'TRIGGERS_MEMORY': 'TRIGGERS_MEMORY',
    'EMOTIONALLY_ATTACHED_TO': 'EMOTIONALLY_ATTACHED_TO',
    'LIMITED_BY': 'LIMITED_BY',
    'CHANGED_AFTER': 'CHANGED_AFTER',
    'INFLUENCED_BY': 'INFLUENCED_BY'
}