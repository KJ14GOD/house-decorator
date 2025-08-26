import time
import random
import string
from typing import Optional, List, Dict, Any
from datetime import datetime

from .neo4j import get_driver
from .schemas import (
    UserNode, CreateUserNode, 
    EmotionNode, CreateEmotionNode,
    FurnitureNode, CreateFurnitureNode,
    SpaceNode, CreateSpaceNode,
    ActivityNode, CreateActivityNode,
    ConstraintNode, CreateConstraintNode,
    
)
from .relationships import RelationshipProperties, RELATIONSHIP_TYPES

# Helper function to generate unique IDs
def generate_id(prefix: str) -> str:
    timestamp = int(time.time() * 1000)
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
    return f"{prefix}_{timestamp}_{random_str}"

# Node Operations
class MemoryNodeOperations:
    
    @staticmethod
    def create_user(user_data: CreateUserNode) -> UserNode:
        driver = get_driver()
        
        with driver.session() as session:
            user_node = UserNode(
                userId=user_data.userId,
                name=user_data.name,
                email=user_data.email,
                createdAt=datetime.now().isoformat(),
                lastActive=datetime.now().isoformat(),
                lifestage=user_data.lifestage,
                livingSituation=user_data.livingSituation
            )
            
            result = session.run(
                "CREATE (u:User $props) RETURN u",
                props=user_node.__dict__
            )
            
            return UserNode(**result.single()['u'])

    @staticmethod
    def get_user(user_id: str) -> Optional[UserNode]:
        driver = get_driver()
        
        with driver.session() as session:
            result = session.run(
                "MATCH (u:User {userId: $userId}) RETURN u",
                userId=user_id
            )
            
            record = result.single()
            if not record:
                return None
            return UserNode(**record['u'])

    @staticmethod
    def create_emotion(emotion_data: CreateEmotionNode) -> EmotionNode:
        driver = get_driver()
        
        with driver.session() as session:
            emotion_node = EmotionNode(
                emotionId=generate_id('emotion'),
                name=emotion_data.name,
                category=emotion_data.category,
                intensity=emotion_data.intensity,
                description=emotion_data.description
            )
            
            result = session.run(
                "CREATE (e:Emotion $props) RETURN e",
                props=emotion_node.__dict__
            )
            
            return EmotionNode(**result.single()['e'])

    @staticmethod
    def create_furniture(furniture_data: CreateFurnitureNode) -> FurnitureNode:
        driver = get_driver()
        
        with driver.session() as session:
            furniture_node = FurnitureNode(
                furnitureId=generate_id('furniture'),
                name=furniture_data.name,
                category=furniture_data.category,
                style=furniture_data.style,
                color=furniture_data.color
            )
            
            result = session.run(
                "CREATE (f:Furniture $props) RETURN f",
                props=furniture_node.__dict__
            )
            
            return FurnitureNode(**result.single()['f'])

    @staticmethod
    def create_space(space_data: CreateSpaceNode) -> SpaceNode:
        driver = get_driver()
        
        with driver.session() as session:
            space_node = SpaceNode(
                spaceId=generate_id('space'),
                name=space_data.name,
                purpose=space_data.purpose,
                size=space_data.size,
                lightingType=space_data.lightingType,
                color=space_data.color
            )
            
            result = session.run(
                "CREATE (s:Space $props) RETURN s",
                props=space_node.__dict__
            )
            
            return SpaceNode(**result.single()['s'])

    @staticmethod
    def create_activity(activity_data: CreateActivityNode) -> ActivityNode:
        driver = get_driver()
        
        with driver.session() as session:
            activity_node = ActivityNode(
                activityId=generate_id('activity'),
                name=activity_data.name,
                timeOfDay=activity_data.timeOfDay,
                frequency=activity_data.frequency,
                importance=activity_data.importance
            )
            
            result = session.run(
                "CREATE (a:Activity $props) RETURN a",
                props=activity_node.__dict__
            )
            
            return ActivityNode(**result.single()['a'])

    @staticmethod
    def create_constraint(constraint_data: CreateConstraintNode) -> ConstraintNode:
        driver = get_driver()
        
        with driver.session() as session:
            constraint_node = ConstraintNode(
                constraintId=generate_id('constraint'),
                type=constraint_data.type,
                description=constraint_data.description,
                severity=constraint_data.severity,
                isTemporary=constraint_data.isTemporary
            )
            
            result = session.run(
                "CREATE (c:Constraint $props) RETURN c",
                props=constraint_node.__dict__
            )
            
            return ConstraintNode(**result.single()['c'])

   
# Relationship Operations
class MemoryRelationshipOperations:
    
    @staticmethod
    def create_relationship(
        from_node_id: str,
        from_node_type: str,
        to_node_id: str, 
        to_node_type: str,
        relationship_type: str,
        properties: RelationshipProperties
    ) -> bool:
        driver = get_driver()
        
        with driver.session() as session:
            relationship_props = {
                **properties,
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            }

            # Handle User node differently (uses userId instead of generated ID)
            if from_node_type == 'User':
                from_match = f"from.userId = $fromId"
            else:
                from_match = f"from.{from_node_type.lower()}Id = $fromId"
                
            if to_node_type == 'User':
                to_match = f"to.userId = $toId"
            else:
                to_match = f"to.{to_node_type.lower()}Id = $toId"

            query = f"""
                MATCH (from:{from_node_type}), (to:{to_node_type})
                WHERE {from_match} AND {to_match}
                CREATE (from)-[r:{relationship_type} $props]->(to)
                RETURN r
            """
            
            result = session.run(query, {
                'fromId': from_node_id,
                'toId': to_node_id,
                'props': relationship_props
            })
            
            return len(result.data()) > 0

    @staticmethod
    def get_user_relationships(user_id: str) -> List[Dict[str, Any]]:
        driver = get_driver()
        
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $userId})-[r]->(n) 
                RETURN type(r) as relationshipType, properties(r) as relationshipProps, 
                       labels(n) as nodeLabels, properties(n) as nodeProps
                """,
                userId=user_id
            )
            
            return [
                {
                    'relationshipType': record['relationshipType'],
                    'relationshipProps': dict(record['relationshipProps']),
                    'nodeLabels': record['nodeLabels'],
                    'nodeProps': dict(record['nodeProps'])
                }
                for record in result
            ]

    @staticmethod
    def get_emotional_triggers(user_id: str, emotion: str) -> List[Dict[str, Any]]:
        driver = get_driver()
        
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $userId})-[r]->(n)
                WHERE r.emotion = $emotion
                RETURN type(r) as relationshipType, properties(r) as relationshipProps,
                       labels(n) as nodeLabels, properties(n) as nodeProps
                """,
                userId=user_id, emotion=emotion
            )
            
            return [
                {
                    'relationshipType': record['relationshipType'],
                    'relationshipProps': dict(record['relationshipProps']),
                    'nodeLabels': record['nodeLabels'],
                    'nodeProps': dict(record['nodeProps'])
                }
                for record in result
            ]

# Query Operations - for the "telepathic" understanding
class MemoryQueryOperations:
    
    @staticmethod
    def get_emotional_profile(user_id: str) -> List[Dict[str, Any]]:
        driver = get_driver()
        
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $userId})-[r]->(n)
                WHERE r.emotion IS NOT NULL
                RETURN r.emotion as emotion, count(*) as frequency,
                       collect(distinct labels(n)[0]) as triggeredBy
                ORDER BY frequency DESC
                """,
                userId=user_id
            )
            
            return [
                {
                    'emotion': record['emotion'],
                    'frequency': int(record['frequency']),
                    'triggeredBy': record['triggeredBy']
                }
                for record in result
            ]

    @staticmethod
    def get_avoidance_patterns(user_id: str) -> List[Dict[str, Any]]:
        driver = get_driver()
        
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $userId})-[r:AVOIDS_DUE_TO]->(n)
                RETURN properties(n) as avoided, r.reason as reason, r.description as description
                """,
                userId=user_id
            )
            
            return [
                {
                    'avoided': dict(record['avoided']),
                    'reason': record['reason'],
                    'description': record['description']
                }
                for record in result
            ]

# Action/Trace Operations for MAS
class MemoryActionOps:
    """Lightweight helpers to record MAS routing/changes without requiring full schema changes."""

    @staticmethod
    def record_routed_to(user_id: str, agent_name: str, reason: str = "", confidence: float | None = None, complexity: str | None = None, session_id: str | None = None) -> None:
        """Record that the Orchestrator routed to an Agent for a given user.

        Creates minimal nodes if missing: (:Orchestrator {name:"router"}) and (:Agent {name: agent_name}).
        Also links the User to the Agent for personalization traces.
        """
        if not user_id or not agent_name:
            return

        # Build props without nulls (Neo4j cannot CREATE/MERGE relationships with null property values)
        base_props = {"reason": reason, "ts": None, "userId": user_id}
        u_props = {"agent": agent_name, "reason": reason, "ts": None}
        if session_id:
            base_props["sessionId"] = session_id
            u_props["sessionId"] = session_id
        if confidence is not None:
            base_props["confidence"] = float(confidence)
            u_props["confidence"] = float(confidence)
        if complexity:
            base_props["complexity"] = complexity
            u_props["complexity"] = complexity

        driver = get_driver()
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                MERGE (o:Orchestrator {name: 'router'})
                MERGE (a:Agent {name: $agent})
                WITH u,o,a,$baseProps AS bp,$uProps AS up
                CREATE (o)-[:ROUTED_TO {reason: bp.reason, userId: $userId, ts: timestamp() 
                    """ + (", confidence: bp.confidence" if "confidence" in base_props else "") + (", complexity: bp.complexity" if "complexity" in base_props else "") + "}]->(a)\n" +
                "                CREATE (u)-[:ROUTED_TO {agent: $agent, reason: up.reason, ts: timestamp() " + (", confidence: up.confidence" if "confidence" in u_props else "") + (", complexity: up.complexity" if "complexity" in u_props else "") + "}]->(a)\n",
                {
                    "userId": user_id,
                    "agent": agent_name,
                    "baseProps": base_props,
                    "uProps": u_props,
                },
            )

    @staticmethod
    def start_session(user_id: str) -> str:
        """Create a Session node and relate it to the user. Returns sessionId."""
        session_id = generate_id('session')
        driver = get_driver()
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                CREATE (s:Session {sessionId: $sessionId, startedAt: timestamp()})
                CREATE (u)-[:STARTED_SESSION {ts: timestamp()}]->(s)
                """,
                {"userId": user_id, "sessionId": session_id},
            )
        return session_id

    @staticmethod
    def record_changed(agent_name: str, session_id: str, summary: str = "") -> None:
        """Record that an Agent effected a change during a session."""
        if not session_id or not agent_name:
            return
        driver = get_driver()
        with driver.session() as session:
            session.run(
                """
                MERGE (a:Agent {name: $agent})
                WITH a
                MATCH (s:Session {sessionId: $sessionId})
                CREATE (a)-[:CHANGED {summary: $summary, ts: timestamp()}]->(s)
                """,
                {"agent": agent_name, "sessionId": session_id, "summary": summary or ""},
            )

    @staticmethod
    def record_session_summary(session_id: str, user_id: str | None, agents_used: list[str], num_tool_calls: int, final_message: str = "") -> None:
        """Create a compact SessionSummary node and link it to Session (and User for convenience)."""
        if not session_id:
            return
        driver = get_driver()
        with driver.session() as session:
            props = {
                "sessionId": session_id,
                "agentsUsed": agents_used or [],
                "numToolCalls": int(num_tool_calls or 0),
                "finalMessage": (final_message[:300] if final_message else ""),
                "endedAt": None,
            }
            cypher = (
                "MATCH (s:Session {sessionId: $sessionId})\n"
                "CREATE (ss:SessionSummary {sessionId: $sessionId, agentsUsed: $agentsUsed, numToolCalls: $numToolCalls, finalMessage: $finalMessage, endedAt: timestamp()})\n"
                "CREATE (s)-[:SESSION_SUMMARY]->(ss)\n"
            )
            params = {
                "sessionId": session_id,
                "agentsUsed": props["agentsUsed"],
                "numToolCalls": props["numToolCalls"],
                "finalMessage": props["finalMessage"],
            }
            if user_id:
                cypher += "WITH ss\nMATCH (u:User {userId: $userId})\nMERGE (u)-[:SESSION_SUMMARY]->(ss)\n"
                params["userId"] = user_id
            session.run(cypher, params)

    # --- Object/Surface action writes ---
    @staticmethod
    def _clean_props(props: dict) -> dict:
        return {k: v for k, v in (props or {}).items() if v is not None}

    @staticmethod
    def record_placed(user_id: str, session_id: str, item_name: str, x: float, y: float, z: float, w: float, h: float, d: float, color: str | None = None) -> None:
        if not (user_id and session_id and item_name):
            return
        driver = get_driver()
        props = MemoryActionOps._clean_props({
            "sessionId": session_id,
            "x": float(x), "y": float(y), "z": float(z),
            "width": float(w), "height": float(h), "depth": float(d),
            "color": color, "ts": None,
        })
        name_lc = (item_name or "").strip().lower()
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                MERGE (i:Furniture {name: $nameLc})
                ON CREATE SET i.displayName = $displayName
                CREATE (u)-[r:PLACED]->(i)
                SET r += $props, r.ts = timestamp()
                """,
                {"userId": user_id, "nameLc": name_lc, "displayName": item_name, "props": props},
            )

    @staticmethod
    def record_moved(user_id: str, session_id: str, item_name: str, to_pos: dict, from_pos: dict | None = None) -> None:
        if not (user_id and session_id and item_name and to_pos):
            return
        driver = get_driver()
        # Flatten coordinate maps into primitive properties (Neo4j cannot store nested maps)
        to_x = to_pos.get('x'); to_y = to_pos.get('y'); to_z = to_pos.get('z')
        fr_x = (from_pos or {}).get('x') if from_pos else None
        fr_y = (from_pos or {}).get('y') if from_pos else None
        fr_z = (from_pos or {}).get('z') if from_pos else None
        props = MemoryActionOps._clean_props({
            "sessionId": session_id,
            "toX": float(to_x) if to_x is not None else None,
            "toY": float(to_y) if to_y is not None else None,
            "toZ": float(to_z) if to_z is not None else None,
            "fromX": float(fr_x) if fr_x is not None else None,
            "fromY": float(fr_y) if fr_y is not None else None,
            "fromZ": float(fr_z) if fr_z is not None else None,
            "ts": None,
        })
        name_lc = (item_name or "").strip().lower()
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                MERGE (i:Furniture {name: $nameLc})
                CREATE (u)-[r:MOVED]->(i)
                SET r += $props, r.ts = timestamp()
                """,
                {"userId": user_id, "nameLc": name_lc, "props": props},
            )

    @staticmethod
    def record_recolored(user_id: str, session_id: str, surface: str, to_color: str, from_color: str | None = None) -> None:
        if not (user_id and session_id and surface and to_color):
            return
        driver = get_driver()
        # Normalize surface name/side
        surf_key = (surface or "").strip()
        side = None
        if surf_key in ["wallFrontColor", "wallBackColor", "wallLeftColor", "wallRightColor"]:
            side = surf_key.replace("wall", "").replace("Color", "").lower()
            norm_surface = "wall_color"
        elif surf_key == "floorColor":
            norm_surface = "floor_color"
        elif surf_key == "ceilingColor":
            norm_surface = "ceiling_color"
        else:
            norm_surface = surf_key or "surface"

        props = MemoryActionOps._clean_props({
            "sessionId": session_id,
            "surface": norm_surface,
            "side": side,
            "to": to_color,
            "from": from_color,
            "ts": None,
        })
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                MERGE (s:Surface {name: $surface})
                CREATE (u)-[r:RECOLORED]->(s)
                SET r += $props, r.ts = timestamp()
                """,
                {"userId": user_id, "surface": norm_surface, "props": props},
            )

    @staticmethod
    def record_removed(user_id: str, session_id: str, item_name: str) -> None:
        if not (user_id and session_id and item_name):
            return
        driver = get_driver()
        props = MemoryActionOps._clean_props({"sessionId": session_id, "ts": None})
        name_lc = (item_name or "").strip().lower()
        with driver.session() as session:
            session.run(
                """
                MERGE (u:User {userId: $userId})
                MERGE (i:Furniture {name: $nameLc})
                CREATE (u)-[r:REMOVED]->(i)
                SET r += $props, r.ts = timestamp()
                """,
                {"userId": user_id, "nameLc": name_lc, "props": props},
            )