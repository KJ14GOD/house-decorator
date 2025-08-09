import os
from typing import TypedDict, List, Dict, Any, Literal
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import create_react_agent
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import re

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- Pydantic Models for API ---
class Block(BaseModel):
    name: str
    width: float
    height: float
    depth: float
    x: float
    y: float
    z: float
    color: str

class RoomState(BaseModel):
    width: float
    length: float  
    height: float
    floorColor: str
    ceilingColor: str
    wallFrontColor: str
    wallBackColor: str
    wallLeftColor: str
    wallRightColor: str
    blocks: List[Block]

class DesignRequest(BaseModel):
    user_input: str
    room_state: RoomState

class DesignResponse(BaseModel):
    message: str
    actions: List[Dict[str, Any]]
    agent_used: str
    reasoning: str

# --- Agent State Definition ---
class AgentState(TypedDict):
    user_query: str
    room_state: Dict[str, Any]
    actions: List[Dict[str, Any]]
    agent_used: str
    reasoning: str
    final_message: str
    tool_calls: List[Dict[str, Any]]
    agents_needed: List[str]
    execution_strategy: str
    routing_reasoning: str
    complexity: str
    current_agent_index: int
    agents_completed: List[str]
    reasoning_trace: List[Dict[str, Any]]
    user_intent: Dict[str, Any]
    trace_events: List[Dict[str, Any]]
    planning_summary: str

# --- Real Furniture Library from Frontend ---
FURNITURE_LIBRARY = [
    {"name": "Single Bed", "width": 3, "height": 2, "depth": 6.5, "color": "#8B4513", "category": "Bedroom"},
    {"name": "Double Bed", "width": 4.5, "height": 2, "depth": 6.5, "color": "#8B4513", "category": "Bedroom"},
    {"name": "King Bed", "width": 6, "height": 2, "depth": 6.5, "color": "#8B4513", "category": "Bedroom"},
    {"name": "Nightstand", "width": 1.5, "height": 2, "depth": 1.5, "color": "#654321", "category": "Bedroom"},
    {"name": "Dresser", "width": 5, "height": 3, "depth": 1.5, "color": "#654321", "category": "Bedroom"},
    {"name": "Sofa", "width": 7, "height": 2.5, "depth": 3, "color": "#4A5568", "category": "Living Room"},
    {"name": "Coffee Table", "width": 4, "height": 1.5, "depth": 2, "color": "#8B4513", "category": "Living Room"},
    {"name": "TV Stand", "width": 5, "height": 2, "depth": 1.5, "color": "#2D3748", "category": "Living Room"},
    {"name": "Armchair", "width": 3, "height": 3, "depth": 3, "color": "#4A5568", "category": "Living Room"},
    {"name": "Dining Table", "width": 6, "height": 2.5, "depth": 3, "color": "#8B4513", "category": "Dining Room"},
    {"name": "Dining Chair", "width": 1.5, "height": 3, "depth": 1.5, "color": "#654321", "category": "Dining Room"},
    {"name": "Kitchen Island", "width": 6, "height": 3, "depth": 2.5, "color": "#FFFFFF", "category": "Kitchen"},
    {"name": "Refrigerator", "width": 2.5, "height": 6, "depth": 2.5, "color": "#E2E8F0", "category": "Kitchen"},
    {"name": "Desk", "width": 4, "height": 2.5, "depth": 2, "color": "#8B4513", "category": "Office"},
    {"name": "Office Chair", "width": 2, "height": 3.5, "depth": 2, "color": "#2D3748", "category": "Office"},
    {"name": "Bookshelf", "width": 3, "height": 6, "depth": 1, "color": "#654321", "category": "Office"},
    {"name": "Door", "width": 3, "height": 7, "depth": 0.2, "color": "#8B4513", "category": "Architectural"},
    {"name": "Window", "width": 4, "height": 4, "depth": 0.1, "color": "#E2E8F0", "category": "Architectural"}
]

def get_furniture_by_name(name: str):
    """Helper function to get furniture details by name (case-insensitive)"""
    for item in FURNITURE_LIBRARY:
        if item["name"].lower() == name.lower():
            return item
    return None

def get_available_furniture_names():
    """Helper function to get list of all available furniture names"""
    return [item["name"] for item in FURNITURE_LIBRARY]

# --- Room Manipulation Tools ---
@tool
def change_wall_color(color: str, wall: str = "front") -> str:
    """
    Change the color of a specific wall in the room.
    Args:
        color: The new color in hex format (e.g., '#0000FF' for blue)
        wall: Which wall to change ('front', 'back', 'left', 'right', or 'all')
    Returns:
        Confirmation message about the color change
    """
    if wall == "all":
        return f"Changed all walls to {color}"
    else:
        return f"Changed {wall} wall to {color}"

@tool 
def change_ceiling_color(color: str) -> str:
    """
    Change the ceiling color of the room.
    Args:
        color: The new ceiling color in hex format
    Returns:
        Confirmation message
    """
    return f"Changed ceiling color to {color}"

@tool
def change_floor_color(color: str) -> str:
    """
    Change the floor color of the room.
    Args:
        color: The new floor color in hex format  
    Returns:
        Confirmation message
    """
    return f"Changed floor color to {color}"

@tool
def add_furniture(furniture_name: str, x: float, y: float, z: float, color: str = None) -> str:
    """
    Add a piece of furniture to the room using the actual furniture library.
    Args:
        furniture_name: Exact name of furniture from library (e.g., 'Sofa', 'Coffee Table', 'Single Bed')
        x: X coordinate for placement
        y: Y coordinate for placement (usually 0 for floor level)
        z: Z coordinate for placement
        color: Optional color override in hex format (uses default color if not provided)
    Returns:
        Confirmation message about furniture placement or error if furniture not found
    """
    # Find the furniture in our library
    furniture = get_furniture_by_name(furniture_name)
    
    if not furniture:
        available_names = ", ".join(get_available_furniture_names())
        return f"Error: '{furniture_name}' not found in furniture library. Available furniture: {available_names}"
    
    # Use provided color or default from library
    final_color = color if color else furniture["color"]
    
    return f"Added {furniture['name']} at position ({x}, {y}, {z}) with dimensions {furniture['width']}x{furniture['height']}x{furniture['depth']} in color {final_color}. Category: {furniture['category']}"

@tool
def move_furniture(furniture_name: str, new_x: float, new_y: float, new_z: float) -> str:
    """
    Move an existing piece of furniture to a new location.
    Args:
        furniture_name: Name of the furniture to move (must exist in current room)
        new_x: New X coordinate
        new_y: New Y coordinate  
        new_z: New Z coordinate
    Returns:
        Confirmation message about the move
    """
    # In a real implementation, we'd check if the furniture exists in the current room state
    # For now, we'll assume it exists and provide helpful feedback
    return f"Moved {furniture_name} to new position ({new_x}, {new_y}, {new_z}). Make sure this furniture item exists in the current room."

@tool
def remove_furniture(furniture_name: str) -> str:
    """
    Remove a piece of furniture from the room.
    Args:
        furniture_name: Name of the furniture to remove (must exist in current room)
    Returns:
        Confirmation message about removal
    """
    # In a real implementation, we'd check if the furniture exists in the current room state
    # For now, we'll assume it exists and provide helpful feedback
    return f"Removed {furniture_name} from the room. Make sure this furniture item exists in the current room."

@tool
def list_available_furniture(category: str = None) -> str:
    """
    List all available furniture in the library, optionally filtered by category.
    Args:
        category: Optional category filter ('Bedroom', 'Living Room', 'Dining Room', 'Kitchen', 'Office', 'Architectural')
    Returns:
        List of available furniture with details
    """
    if category:
        filtered_items = [item for item in FURNITURE_LIBRARY if item["category"].lower() == category.lower()]
        if not filtered_items:
            return f"No furniture found in category '{category}'. Available categories: Bedroom, Living Room, Dining Room, Kitchen, Office, Architectural"
        items_text = "\n".join([f"- {item['name']}: {item['width']}x{item['height']}x{item['depth']} ({item['color']})" for item in filtered_items])
        return f"Available {category} furniture:\n{items_text}"
    else:
        items_by_category = {}
        for item in FURNITURE_LIBRARY:
            if item["category"] not in items_by_category:
                items_by_category[item["category"]] = []
            items_by_category[item["category"]].append(f"{item['name']}: {item['width']}x{item['height']}x{item['depth']}")
        
        result = "Available furniture by category:\n"
        for cat, items in items_by_category.items():
            result += f"\n{cat}:\n" + "\n".join([f"  - {item}" for item in items])
        return result

@tool
def analyze_room_colors() -> str:
    """
    Analyze the current room colors and provide color theory insights.
    Returns:
        Analysis of current color scheme
    """
    return "Analyzed current room colors. The color scheme provides a balanced foundation for further design decisions."

@tool  
def suggest_color_palette(style: str = "modern") -> str:
    """
    Suggest a coordinated color palette based on style preference.
    Args:
        style: Design style ('modern', 'traditional', 'minimalist', 'bohemian')
    Returns:
        Color palette suggestions
    """
    palettes = {
        'modern': "Modern palette: Walls #F5F5F5, Accents #2C3E50, Floor #E8E8E8",
        'traditional': "Traditional palette: Walls #F4F1EA, Accents #8B4513, Floor #D2691E", 
        'minimalist': "Minimalist palette: Walls #FFFFFF, Accents #404040, Floor #F8F8F8",
        'bohemian': "Bohemian palette: Walls #F2E8D5, Accents #D2691E, Floor #8B4513"
    }
    return palettes.get(style, palettes['modern'])

# --- Initialize LLM ---
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

# --- Simple Intent Analysis (heuristic) ---
def analyze_user_intent(user_query: str) -> Dict[str, Any]:
    """Extract simple intent signals to guide routing and prompts."""
    text = user_query.lower()
    style = None
    if any(k in text for k in ["modern", "sleek", "contemporary"]):
        style = "modern"
    elif any(k in text for k in ["cozy", "warm", "comfy", "inviting"]):
        style = "cozy"
    elif any(k in text for k in ["minimal", "minimalist", "clean"]):
        style = "minimalist"
    elif any(k in text for k in ["industrial", "loft"]):
        style = "industrial"

    mood = None
    if any(k in text for k in ["dark", "moody"]):
        mood = "dark"
    elif any(k in text for k in ["bright", "light", "airy"]):
        mood = "bright"
    elif any(k in text for k in ["chilly", "chill", "cold", "icy", "wintry", "arctic", "cool", "cooler", "blue", "bluish", "teal", "aqua"]):
        mood = "cool"
    elif any(k in text for k in ["warm", "warmth", "cozy", "coziness", "amber", "terracotta", "goldenrod", "tan", "sandy"]):
        mood = "warm"

    scope = "tweak"
    if any(k in text for k in ["fully furnished", "complete", "full setup", "full design", "everything"]):
        scope = "fully_furnished"

    return {
        "style": style,
        "mood": mood,
        "scope": scope,
    }

# --- Color utilities & pattern detection ---
_COLOR_NAME_TO_HEX = {
    # basics
    "white": "#FFFFFF", "black": "#000000", "gray": "#808080", "grey": "#808080",
    "light gray": "#D3D3D3", "light grey": "#D3D3D3",
    # warms
    "pink": "#FFC0CB", "hot pink": "#FF69B4", "red": "#FF0000", "orange": "#FFA500",
    "tan": "#D2B48C", "beige": "#F5F5DC", "brown": "#8B4513",
    # cools
    "blue": "#87CEEB", "light blue": "#A0C4FF", "navy": "#000080", "teal": "#008080",
    "aqua": "#00FFFF", "cyan": "#00BCD4", "green": "#008000",
    # neutrals
    "off white": "#F5F5F5",
}

_HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})")

def _extract_color_from_phrase(phrase: str) -> str:
    if not isinstance(phrase, str):
        return str(phrase)
    text = phrase.strip().lower()
    # 1) Prefer explicit hex
    m = _HEX_RE.search(text)
    if m:
        return m.group(0).upper()
    # 2) Try longest color name match contained in the phrase
    for name in sorted(_COLOR_NAME_TO_HEX.keys(), key=len, reverse=True):
        if name in text:
            return _COLOR_NAME_TO_HEX[name]
    # 3) Heuristic: trim trailing descriptors like 'on the walls', 'on walls'
    for tail in [" on the walls", " on walls", " on wall", " walls", " wall"]:
        if text.endswith(tail):
            trimmed = text[: -len(tail)].strip()
            for name in sorted(_COLOR_NAME_TO_HEX.keys(), key=len, reverse=True):
                if name in trimmed:
                    return _COLOR_NAME_TO_HEX[name]
            return trimmed
    return phrase

def resolve_color_string(color_text: str) -> str:
    return _extract_color_from_phrase(color_text)

def detect_color_ambiguity(user_query: str) -> Dict[str, Any] | None:
    """Detect ambiguous color requests that need clarification while preserving full context"""
    query = user_query.lower().strip()
    
    # Extract all color and element mentions from the query
    def extract_color_elements(query_text):
        """Extract color assignments from query"""
        elements = {}
        colors = []
        
        # Find all colors mentioned
        color_matches = re.findall(r'\b(blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)\b', query_text)
        colors = list(set(color_matches))  # Remove duplicates
        
        # Find explicit element mentions
        if re.search(r'\b(?:ceiling)\b', query_text):
            elements['ceiling'] = colors[0] if colors else None
        if re.search(r'\b(?:floor)\b', query_text):
            elements['floor'] = colors[0] if colors else None
            
        return elements, colors
    
    # Parse the full query to understand non-ambiguous parts
    non_ambiguous_elements, mentioned_colors = extract_color_elements(query)
    primary_color = mentioned_colors[0] if mentioned_colors else "that color"
    
    # Pattern 1: "walls" without specifying which walls or "all"
    # Covers both "make walls blue" and "blue walls" patterns
    wall_color_patterns = [
        # "make/change/paint walls [to] color"
        r'\b(?:make|change|paint)\s+(?:the\s+)?walls?\s+(?:to\s+)?(?:blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)',
        # "color walls" 
        r'\b(?:blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)\s+walls?',
        # "walls color" (less common but possible)
        r'\bwalls?\s+(?:blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)'
    ]
    
    for pattern in wall_color_patterns:
        if re.search(pattern, query):
            # Check if specific walls are mentioned (if so, it's not ambiguous)
            if not re.search(r'\b(?:all|front|back|left|right)\s+walls?', query) and not re.search(r'walls?\s+(?:all|front|back|left|right)', query):
                
                # Build the base actions that include non-ambiguous elements
                base_actions = []
                if 'ceiling' in non_ambiguous_elements:
                    base_actions.append(f"change ceiling to {primary_color}")
                if 'floor' in non_ambiguous_elements:
                    base_actions.append(f"change floor to {primary_color}")
                
                base_action_str = "; ".join(base_actions)
                separator = "; " if base_actions else ""
                
                return {
                    "issue": f"Ambiguous wall selection in multi-element request",
                    "message": f"I can change the walls to {primary_color}! Which walls would you like me to change?" + (f" (I'll also change the {', '.join(non_ambiguous_elements.keys())} as requested.)" if non_ambiguous_elements else ""),
                    "questions": [
                        {"id": "all_walls", "text": "All walls", "action": f"change all walls to {primary_color}{separator}{base_action_str}"},
                        {"id": "front_wall", "text": "Front wall only", "action": f"change front wall to {primary_color}{separator}{base_action_str}"},
                        {"id": "back_wall", "text": "Back wall only", "action": f"change back wall to {primary_color}{separator}{base_action_str}"},
                        {"id": "left_wall", "text": "Left wall only", "action": f"change left wall to {primary_color}{separator}{base_action_str}"},
                        {"id": "right_wall", "text": "Right wall only", "action": f"change right wall to {primary_color}{separator}{base_action_str}"},
                    ]
                }
    
    # Pattern 2: Color mentioned but no specific element 
    if re.search(r'\b(?:make|change|paint)\s+(?:it|everything|room)\s+(?:blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)', query):
        color_match = re.search(r'\b(?:blue|red|green|yellow|pink|white|black|gray|grey|orange|purple|brown)\b', query)
        color = color_match.group() if color_match else "that color"
        
        return {
            "issue": f"Ambiguous color target",
            "message": f"I can make things {color}! What would you like me to change?",
            "questions": [
                {"id": "all_elements", "text": "Everything (walls, ceiling, floor)", "action": f"change all walls, ceiling, and floor to {color}"},
                {"id": "walls_only", "text": "All walls only", "action": f"change all walls to {color}"},
                {"id": "walls_ceiling", "text": "Walls and ceiling", "action": f"change all walls and ceiling to {color}"},
                {"id": "walls_floor", "text": "Walls and floor", "action": f"change all walls and floor to {color}"},
                {"id": "custom_select", "text": "Let me choose specific elements", "action": "show_element_selector"}
            ]
        }
    
    # Pattern 3: Vague mood requests
    if re.search(r'\b(?:make|change)\s+(?:it|room|everything)\s+(?:warmer|cooler|brighter|darker|cozy|modern|traditional)', query):
        mood_match = re.search(r'\b(?:warmer|cooler|brighter|darker|cozy|modern|traditional)\b', query)
        mood = mood_match.group() if mood_match else "that style"
        
        return {
            "issue": f"Ambiguous mood application",
            "message": f"I can make the room {mood}! Which elements should I adjust?",
            "questions": [
                {"id": "all_elements", "text": "Everything (walls, ceiling, floor)", "action": f"apply {mood} style to all elements"},
                {"id": "walls_only", "text": "Walls only", "action": f"apply {mood} style to walls"},
                {"id": "accent_elements", "text": "Walls and ceiling", "action": f"apply {mood} style to walls and ceiling"},
            ]
        }
    
    return None  # No ambiguity detected

def detect_alternating_pattern(user_query: str) -> Dict[str, Any] | None:
    """Detect alternating color intent like 'alternate between pink and blue'."""
    text = user_query.lower()
    # common phrasing: alternate between X and Y / alternating X and Y / alternate X & Y
    m = re.search(r"alternat\w*\s+(?:between\s+)?([a-z#0-9#\s]+?)\s+(?:and|&)\s+([a-z#0-9#\s]+)(?:\b|\s|\.|,|$)", text)
    if not m:
        return None
    c1 = _extract_color_from_phrase(m.group(1).strip())
    c2 = _extract_color_from_phrase(m.group(2).strip())
    return {"type": "alternate_walls", "colors": [c1, c2]}

# --- Orchestrator planner: produce initial ReAct planning text ---
def orchestrator_planner(state: AgentState) -> str:
    user_query = state.get("user_query", "")
    room_info = state.get("room_state", {})
    intent = analyze_user_intent(user_query)
    style = intent.get("style") or "unspecified"
    mood = intent.get("mood") or "balanced"
    scope = intent.get("scope") or "tweak"
    planning_prompt = f"""
You are the Orchestrator for a multi-agent interior design system. Before any agent runs, provide a concise ReAct-style plan.

User Query: "{user_query}"
Room: {room_info.get('width', '?')}x{room_info.get('length', '?')}x{room_info.get('height', '?')} ft
Intent hints → style: {style}, mood: {mood}, scope: {scope}

Thought: Analyze the user's goals, constraints, and the current room context.
Observation: Key facts about the room and user intent.
Plan: Numbered sequence of agent steps and why.
Tools: Which tools will be needed and for what.
Success Criteria: What good looks like for the user.

Output plain text only.
"""
    try:
        resp = llm.invoke(planning_prompt)
        return getattr(resp, "content", "").strip()
    except Exception:
        return (
            "Thought: Understand goals and room context.\n"
            "Observation: Dimensions and current colors/furniture.\n"
            "Plan: Route to relevant agents; apply mood-driven colors; adjust furniture.\n"
            "Tools: color + furniture tools.\n"
            "Success Criteria: Matches requested mood/style with clear layout."
        )

# --- Furniture Agent ---
def furniture_agent(state: AgentState) -> AgentState:
    """
    ReAct agent specialized in furniture selection, placement, and arrangement.
    Handles all furniture-related queries using reasoning and action cycles.
    """
    print("🪑 --- Furniture Agent ---")
    
    furniture_tools = [add_furniture, move_furniture, remove_furniture, list_available_furniture]
    agent = create_react_agent(llm, furniture_tools)
    
    # Create context-aware prompt
    room_info = state['room_state']
    intent = state.get('user_intent', {})
    style = intent.get('style') or 'appropriate style'
    scope = intent.get('scope') or 'tweak'
    context = f"""
    Current room: {room_info['width']}x{room_info['length']}ft room with {len(room_info.get('blocks', []))} furniture pieces.
    User request: {state['user_query']}

    Role: You are a professional furniture placement expert. Optimize function, flow, and aesthetics.
    Style emphasis: {style}. Scope: {scope}.

    Requirements:
    - You MUST use the provided tools to make changes. Don't just describe; take actions with tools.
    - Only add furniture that exists in the library. Call list_available_furniture first if unsure.
    - Use exact names from the library (e.g., 'Sofa', 'Coffee Table', 'Single Bed').
    - For "fully furnished" or comprehensive requests, propose a complete set: seating, surfaces, storage as relevant.
    - Ensure choices reflect the style and scope. Avoid repeating the same set for different user goals.
    - After actions, provide a concise summary of the plan you executed.
    """

    # If collision data exists in state, append a collision-resolution brief
    intersections = state.get("collision_pairs") or state.get("intersections") or []
    collision_blocks = state.get("collision_blocks") or state.get("simulated_blocks") or room_info.get('blocks', [])
    if intersections:
        room_w = room_info.get('width', 12)
        room_l = room_info.get('length', 12)
        collision_brief = [
            "\nCollision Resolution Task:",
            "- One or more furniture intersections were detected by the intersection_agent.",
            "- For each pair, move ONE of the objects to eliminate overlap using move_furniture.",
            "- Prefer minimal moves along the X or Z axes, keep Y the same.",
            f"- Keep objects inside room bounds (0..{room_w} in X, 0..{room_l} in Z).",
            "- Avoid introducing new collisions with other objects if possible.",
            "- After resolving one pair, proceed to the next.",
            "\nPairs to resolve:"
        ]
        for inter in intersections:
            collision_brief.append(f"• {inter.get('object1','?')} ↔ {inter.get('object2','?')} (overlap_volume={inter.get('overlap_volume','?')})")
        collision_brief.append("\nCurrent furniture positions (approx):")
        for b in collision_blocks:
            collision_brief.append(f"- {b.get('name','?')}: pos=({b.get('x',0)},{b.get('y',0)},{b.get('z',0)}), size=({b.get('width',1)}x{b.get('height',1)}x{b.get('depth',1)})")
        collision_brief.append("\nNow, perform the required move_furniture calls to resolve all overlaps. Confirm with a brief summary.")
        context += "\n" + "\n".join(collision_brief)
    
    result = agent.invoke({"messages": [context]})
    
    # Extract tool calls and final reasoning
    messages = result["messages"]
    tool_calls: List[Dict[str, Any]] = []
    new_tool_calls: List[Dict[str, Any]] = []
    reasoning_parts = []
    # Build detailed ReAct-style trace for streaming
    agent_trace_events = extract_trace_events(messages, "furniture_agent")
    
    for message in messages:
        if hasattr(message, 'tool_calls') and message.tool_calls:
            for tool_call in message.tool_calls:
                call = {
                    "tool": tool_call["name"],
                    "args": tool_call["args"]
                }
                tool_calls.append(call)
                new_tool_calls.append(call)
        if hasattr(message, 'content') and message.content:
            reasoning_parts.append(message.content)
    
    final_reasoning = messages[-1].content if messages else "No reasoning available"
    
    # Accumulate tool calls instead of overwriting
    existing_tool_calls = state.get("tool_calls", [])
    all_tool_calls = existing_tool_calls + tool_calls
    
    # Accumulate trace events
    existing_trace = state.get("trace_events", [])
    all_trace = existing_trace + agent_trace_events

    return {
        **state,
        "agent_used": "furniture_agent",
        "reasoning": final_reasoning,
        "final_message": f"Furniture Agent: {final_reasoning}",
        "tool_calls": all_tool_calls,
        "trace_events": all_trace,
        "latest_trace_events": agent_trace_events,
        "new_tool_calls": new_tool_calls,
    }

# --- Color Agent ---  
def color_agent(state: AgentState) -> AgentState:
    """
    ReAct agent specialized in color coordination, theory, and harmonious design.
    Handles all color-related queries using reasoning and action cycles.
    """
    print("🎨 --- Color Agent ---")
    
    color_tools = [change_wall_color, change_ceiling_color, change_floor_color, analyze_room_colors, suggest_color_palette]
    agent = create_react_agent(llm, color_tools)
    
    # Create context-aware prompt
    room_info = state['room_state']
    intent = state.get('user_intent', {})
    mood = intent.get('mood') or 'cohesive'
    style = intent.get('style') or 'appropriate style'
    
    # Mood-guided palette suggestions
    cool_guidance = "Cool palettes: Walls #A0C4FF to #8FAADC (soft/calm blues), Ceiling #FFFFFF or #EBEBEB to keep it open, Floor neutral light wood or keep current if already light."
    warm_guidance = "Warm palettes: Walls #D2691E/#CD853F/#F4A460 (warm tones), Ceiling near-white, Floor warm medium wood."
    mood_guidance = cool_guidance if mood in ["cool", "chilly"] else warm_guidance

    # Prepare context for the agent
    context = f"""
    Current room colors:
    - Walls: Front({room_info.get('wallFrontColor', '#FFFFFF')}), Back({room_info.get('wallBackColor', '#FFFFFF')})
    - Ceiling: {room_info.get('ceilingColor', '#FFFFFF')}
    - Floor: {room_info.get('floorColor', '#8B4513')}
    
    You are a color coordination expert. CRITICAL INSTRUCTIONS:
    
    1. **HONOR EXPLICIT USER REQUESTS FIRST**: If the user specifies exact colors (like "pink floor", "blue walls", "white ceiling"), use those colors EXACTLY. Do not override them with mood guidance.
    
    2. **Only apply mood guidance for unspecified elements**: If the user doesn't specify colors for certain room elements, then use mood-driven guidance for those elements only.
    
    3. **Use your tools to make the requested changes**: Don't just describe - actually call the tools to change colors.
    
    Examples:
    - "add pink floor" → use change_floor_color with "#FFC0CB", leave walls/ceiling unchanged
    - "blue walls" → use change_wall_color with "#87CEEB", leave ceiling/floor unchanged  
    - "white ceiling" → use change_ceiling_color with "#FFFFFF", leave walls/floor unchanged
    - "make it warmer" → apply warm palette to all elements (since no specific colors given)
    
    IMPORTANT: When user requests a specific color for a specific element, ONLY change that element. Do not change other elements unless explicitly requested.
    
    Target mood: {mood}. Style: {style}.
    Mood guidance (only for unspecified elements): {mood_guidance}
    """

    # Check for multiple clarification responses (semicolon-separated actions)
    user_query = state['user_query'].lower().strip()
    
    # Handle multiple clarification responses from frontend
    if '; ' in user_query:
        # This indicates multiple selected clarification actions
        individual_actions = [action.strip() for action in user_query.split('; ')]
        print(f"🎨 Processing multiple clarification actions: {individual_actions}")
        
        # Check if any action contains continuation instructions
        continuation_agents = []
        processed_actions = []
        
        for action in individual_actions:
            if '[CONTINUE_WITH_AGENTS:' in action:
                # Extract continuation instruction
                start_idx = action.find('[CONTINUE_WITH_AGENTS:') + len('[CONTINUE_WITH_AGENTS:')
                end_idx = action.find(']', start_idx)
                if end_idx != -1:
                    agents_str = action[start_idx:end_idx].strip()
                    continuation_agents = [agent.strip() for agent in agents_str.split(',') if agent.strip()]
                    # Remove the instruction from the action
                    clean_action = action[:action.find('[CONTINUE_WITH_AGENTS:')].strip()
                    processed_actions.append(clean_action)
                else:
                    processed_actions.append(action)
            else:
                processed_actions.append(action)
        
        print(f"🎨 Cleaned actions: {processed_actions}")
        print(f"🎨 Continuation agents: {continuation_agents}")
        
        # Process each action individually using the agent
        all_tool_calls = []
        all_new_tool_calls = []
        reasoning_parts = []
        agent_trace_events = []
        
        for i, action in enumerate(processed_actions):
            if not action:
                continue
                
            print(f"🎨 Processing action {i+1}/{len(processed_actions)}: {action}")
            reasoning_parts.append(f"Action {i+1}: {action}")
            
            # Create individual context for this action
            individual_context = context + f"\n\nUser request: {action}"
            
            # Process this individual action through the agent
            result = agent.invoke({'messages': [individual_context]})
            
            # Extract tool calls and reasoning from this result
            messages = result['messages']
            for message in messages:
                if hasattr(message, 'tool_calls') and message.tool_calls:
                    for tool_call in message.tool_calls:
                        # Convert to the format expected by the system
                        formatted_call = {
                            "name": tool_call.get('name') or tool_call.get('tool', ''),
                            "args": tool_call.get('args', {}),
                            "tool": tool_call.get('name') or tool_call.get('tool', '')
                        }
                        all_tool_calls.append(tool_call)  # Original format
                        all_new_tool_calls.append(formatted_call)  # System format
                        
                        print(f"🎨 Extracted tool call: {formatted_call}")
            
            # Extract trace events for this individual action
            action_trace_events = extract_trace_events(messages, "color_agent")
            agent_trace_events.extend(action_trace_events)
        
        # Combine all trace events
        existing_trace = state.get("trace_events", [])
        all_trace = existing_trace + [{
            "type": "thought", 
            "agent": "color_agent", 
            "content": f"Processing {len(processed_actions)} clarification responses: {'; '.join(processed_actions)}"
        }] + agent_trace_events
        
        # Update state with all collected tool calls and reasoning
        updated_state = {
            **state,
            "agent_used": "color_agent",
            "reasoning": f"Processed {len(processed_actions)} clarification actions: " + "; ".join(reasoning_parts),
            "final_message": f"Color Agent: Applied {len(processed_actions)} color changes as requested.",
            "tool_calls": all_tool_calls,
            "new_tool_calls": all_new_tool_calls,
            "trace_events": all_trace,
            "latest_trace_events": agent_trace_events
        }
        
        # If there are continuation agents, set them up for execution
        if continuation_agents:
            print(f"🎨 Setting up continuation with agents: {continuation_agents}")
            updated_state["agents_needed"] = continuation_agents
            updated_state["current_agent_index"] = 0
            updated_state["continuing_after_clarification"] = True
        
        print(f"🎨 Completed multiple actions with {len(all_tool_calls)} tool calls and {len(all_new_tool_calls)} formatted calls")
        return updated_state
    
    # Check for alternating pattern FIRST (before ambiguity check)
    pattern = detect_alternating_pattern(state['user_query'])
    if pattern and pattern.get("type") == "alternate_walls" and len(pattern.get("colors", [])) >= 2:
        print(f"🎨 Detected alternating pattern: {pattern}")
        c1, c2 = pattern["colors"][:2]
        # Alternate in order: front, right, back, left
        alt_map = [
            ("front", c1),
            ("right", c2),
            ("back", c1),
            ("left", c2),
        ]
        tool_calls = [{"tool": "change_wall_color", "args": {"color": color, "wall": wall}} for wall, color in alt_map]
        
        # Also check for ceiling and floor color requests in the same query
        user_query_lower = state['user_query'].lower()
        reasoning_parts = [f"Applied alternating wall colors: front/back {c1}, right/left {c2}."]
        
        # Check for ceiling color requests
        if "pink ceiling" in user_query_lower or "ceiling pink" in user_query_lower:
            ceiling_color = resolve_color_string("pink")
            tool_calls.append({"tool": "change_ceiling_color", "args": {"color": ceiling_color}})
            reasoning_parts.append(f"Set ceiling to {ceiling_color}.")
            
        if "blue ceiling" in user_query_lower or "ceiling blue" in user_query_lower:
            ceiling_color = resolve_color_string("blue")
            tool_calls.append({"tool": "change_ceiling_color", "args": {"color": ceiling_color}})
            reasoning_parts.append(f"Set ceiling to {ceiling_color}.")
            
        # Check for floor color requests  
        if "pink floor" in user_query_lower or "floor pink" in user_query_lower:
            floor_color = resolve_color_string("pink")
            tool_calls.append({"tool": "change_floor_color", "args": {"color": floor_color}})
            reasoning_parts.append(f"Set floor to {floor_color}.")
            
        if "blue floor" in user_query_lower or "floor blue" in user_query_lower:
            floor_color = resolve_color_string("blue")
            tool_calls.append({"tool": "change_floor_color", "args": {"color": floor_color}})
            reasoning_parts.append(f"Set floor to {floor_color}.")
        
        final_reasoning = " ".join(reasoning_parts)
        
        # Generate all tool calls up front
        all_tool_calls = state.get("tool_calls", []) + tool_calls
        existing_trace = state.get("trace_events", [])
        agent_trace_events = [
            {"type": "thought", "agent": "color_agent", "content": "Detected alternating wall color request and processing all color changes including ceiling and floor."}
        ] + [
            {"type": "action", "agent": "color_agent", "tool": call["tool"], "args": call["args"]}
            for call in tool_calls
        ]
        all_trace = existing_trace + agent_trace_events
        
        return {
            **state,
            "agent_used": "color_agent",
            "reasoning": final_reasoning,
            "final_message": f"Color Agent: {final_reasoning}",
            "tool_calls": all_tool_calls,
            "trace_events": all_trace,
            "latest_trace_events": agent_trace_events,
            "new_tool_calls": tool_calls,
        }
    
    # Check for ambiguous requests that need clarification (only if no alternating pattern detected)
    ambiguity_check = detect_color_ambiguity(user_query)
    
    if ambiguity_check:
        # Preserve original routing plan for continuation after clarification
        agents_needed = state.get('agents_needed', [])
        current_index = state.get('current_agent_index', 0)
        remaining_agents = agents_needed[current_index+1:] if current_index+1 < len(agents_needed) else []
        
        print(f"🎨 Ambiguity detected. Original plan: {agents_needed}, Current index: {current_index}, Remaining: {remaining_agents}")
        
        # Enhance clarification actions to include continuation plan
        enhanced_questions = []
        for question in ambiguity_check['questions']:
            # Add continuation instruction to each clarification action
            if remaining_agents:
                continuation_instruction = f" [CONTINUE_WITH_AGENTS: {','.join(remaining_agents)}]"
                enhanced_action = question['action'] + continuation_instruction
            else:
                enhanced_action = question['action']
            
            enhanced_questions.append({
                **question,
                'action': enhanced_action
            })
        
        # Return clarification questions with preserved routing context
        return {
            **state,
            "agent_used": "color_agent",
            "reasoning": f"Ambiguous color request detected: {ambiguity_check['issue']}",
            "final_message": f"Color Agent: {ambiguity_check['message']}",
            "needs_clarification": True,
            "clarification_type": "color_selection", 
            "clarification_questions": enhanced_questions,
            # Preserve routing context
            "original_agents_needed": agents_needed,
            "original_current_index": current_index,
            "remaining_agents_after_clarification": remaining_agents,
            "trace_events": state.get("trace_events", []) + [{
                "type": "thought", 
                "agent": "color_agent", 
                "content": f"Detected ambiguous request: {ambiguity_check['issue']}. Asking for clarification. Will continue with: {remaining_agents}"
            }],
            "latest_trace_events": [{
                "type": "thought", 
                "agent": "color_agent", 
                "content": f"Detected ambiguous request: {ambiguity_check['issue']}. Asking for clarification."
            }]
        }

    # Add user request to context
    full_context = context + f"\n\nUser request: {state['user_query']}"

    # Default LLM-driven behavior
    result = agent.invoke({"messages": [full_context]})
    
    # Extract tool calls and final reasoning
    messages = result["messages"]
    tool_calls: List[Dict[str, Any]] = []
    new_tool_calls: List[Dict[str, Any]] = []
    reasoning_parts = []
    # Build detailed ReAct-style trace for streaming
    agent_trace_events = extract_trace_events(messages, "color_agent")
    
    print(f"🎨 Color Agent received {len(messages)} messages")
    for i, message in enumerate(messages):
        print(f"  Message {i}: {type(message)} - {getattr(message, 'content', 'NO CONTENT')[:100]}")
        if hasattr(message, 'tool_calls') and message.tool_calls:
            print(f"  → Found {len(message.tool_calls)} tool calls")
            for tool_call in message.tool_calls:
                call = {
                    "tool": tool_call["name"],
                    "args": tool_call["args"]
                }
                tool_calls.append(call)
                new_tool_calls.append(call)
        if hasattr(message, 'content') and message.content:
            reasoning_parts.append(message.content)
    
    print(f"🎨 Color Agent extracted {len(tool_calls)} tool calls: {tool_calls}")
    
    final_reasoning = messages[-1].content if messages else "No reasoning available"
    
    # Accumulate tool calls instead of overwriting
    existing_tool_calls = state.get("tool_calls", [])
    all_tool_calls = existing_tool_calls + tool_calls
    
    # Accumulate trace events
    existing_trace = state.get("trace_events", [])
    all_trace = existing_trace + agent_trace_events

    return {
        **state,
        "agent_used": "color_agent", 
        "reasoning": final_reasoning,
        "final_message": f"Color Agent: {final_reasoning}",
        "tool_calls": all_tool_calls,
        "trace_events": all_trace,
        "latest_trace_events": agent_trace_events,
        "new_tool_calls": new_tool_calls,
    }

# --- Intersection Agent ---
def intersection_agent(state: AgentState) -> AgentState:
    """
    Analyzes furniture objects in the room and detects intersections/collisions.
    Reports which furniture objects intersect with each other.
    """
    print("🔍 --- Intersection Agent ---")
    
    # Get the current room state and apply any pending tool calls to get accurate furniture positions
    room_state = dict(state['room_state'])  # Make a copy to avoid modifying original
    # Use authoritative room_state directly (kept in sync by the workflow) to avoid duplicate reapplication
    tool_calls = []
    print("🔍 Using authoritative room_state for intersection checks; not replaying tool_calls")
    
    # Deduplicate blocks by (name, x, y, z) signature to avoid mirrored duplicates from repeated application
    seen_signatures = set()
    dedup_blocks = []
    for b in room_state.get('blocks', []):
        sig = (b.get('name'), float(b.get('x',0)), float(b.get('y',0)), float(b.get('z',0)))
        if sig not in seen_signatures:
            seen_signatures.add(sig)
            dedup_blocks.append(b)
    furniture_blocks = dedup_blocks
    
    print(f"🔍 Furniture objects found: {len(furniture_blocks)}")
    for i, block in enumerate(furniture_blocks):
        print(f"🔍 Object {i+1}: {block.get('name', 'Unknown')} at ({block.get('x', 0)}, {block.get('y', 0)}, {block.get('z', 0)}) size ({block.get('width', 1)}x{block.get('height', 1)}x{block.get('depth', 1)})")
    
    if len(furniture_blocks) <= 1:
        # No intersections possible with 0 or 1 furniture objects
        reasoning = "Only one or no furniture objects present - no intersections possible."
        final_message = "Intersection Agent: No furniture intersections detected (insufficient objects for collision)."
    else:
        # Check for intersections between furniture objects
        intersections = []
        
        def boxes_intersect(obj1, obj2):
            """Check if two 3D boxes intersect"""
            # Box 1 boundaries
            x1_min, x1_max = obj1['x'], obj1['x'] + obj1['width']
            y1_min, y1_max = obj1['y'], obj1['y'] + obj1['height']
            z1_min, z1_max = obj1['z'], obj1['z'] + obj1['depth']
            
            # Box 2 boundaries
            x2_min, x2_max = obj2['x'], obj2['x'] + obj2['width']
            y2_min, y2_max = obj2['y'], obj2['y'] + obj2['height']
            z2_min, z2_max = obj2['z'], obj2['z'] + obj2['depth']
            
            # Check intersection in all three dimensions
            x_intersect = x1_max > x2_min and x2_max > x1_min
            y_intersect = y1_max > y2_min and y2_max > y1_min
            z_intersect = z1_max > z2_min and z2_max > z1_min
            
            return x_intersect and y_intersect and z_intersect
        
        # Check all unique unordered pairs of furniture objects
        for i in range(len(furniture_blocks)):
            for j in range(i + 1, len(furniture_blocks)):
                obj1 = furniture_blocks[i]
                obj2 = furniture_blocks[j]
                print(f"🔍 Checking intersection between {obj1.get('name', f'Object {i+1}')} and {obj2.get('name', f'Object {j+1}')}")
                if boxes_intersect(obj1, obj2):
                    print(f"🔍 ✅ INTERSECTION DETECTED!")
                    # Calculate overlap volume for severity
                    x_overlap = min(obj1['x'] + obj1['width'], obj2['x'] + obj2['width']) - max(obj1['x'], obj2['x'])
                    y_overlap = min(obj1['y'] + obj1['height'], obj2['y'] + obj2['height']) - max(obj1['y'], obj2['y'])
                    z_overlap = min(obj1['z'] + obj1['depth'], obj2['z'] + obj2['depth']) - max(obj1['z'], obj2['z'])
                    overlap_volume = x_overlap * y_overlap * z_overlap
                    # Normalize pair key to avoid duplicates (A,B) and (B,A)
                    pair_key = tuple(sorted([obj1.get('name', f'Object {i+1}'), obj2.get('name', f'Object {j+1}')]))
                    intersections.append({
                        'object1': obj1.get('name', f'Object {i+1}'),
                        'object2': obj2.get('name', f'Object {j+1}'),
                        'overlap_volume': round(overlap_volume, 2),
                        'obj1_pos': f"({obj1['x']}, {obj1['y']}, {obj1['z']})",
                        'obj2_pos': f"({obj2['x']}, {obj2['y']}, {obj2['z']})"
                    })
                else:
                    print(f"🔍 ❌ No intersection detected")
        
        # Deduplicate intersections by pair key
        unique_by_pair = {}
        for inter in intersections:
            key = tuple(sorted([inter['object1'], inter['object2']]))
            # keep the one with max overlap volume
            if key not in unique_by_pair or inter['overlap_volume'] > unique_by_pair[key]['overlap_volume']:
                unique_by_pair[key] = inter
        intersections = list(unique_by_pair.values())

        # Generate reasoning and report
        if intersections:
            reasoning_parts = [f"Analyzed {len(furniture_blocks)} furniture objects and found {len(intersections)} intersection(s):"]
            for inter in intersections:
                reasoning_parts.append(
                    f"• {inter['object1']} at {inter['obj1_pos']} intersects with {inter['object2']} at {inter['obj2_pos']} "
                    f"(overlap volume: {inter['overlap_volume']} cubic units)"
                )
            reasoning = " ".join(reasoning_parts)
            final_message = f"Intersection Agent: Found {len(intersections)} furniture collision(s). " + "; ".join([f"{i['object1']} ↔ {i['object2']}" for i in intersections])
        else:
            reasoning = f"Analyzed {len(furniture_blocks)} furniture objects - no intersections detected. All furniture is properly spaced."
            final_message = "Intersection Agent: All furniture objects are properly positioned with no intersections detected."
    
    # Create trace events
    agent_trace_events = [{
        "type": "thought",
        "agent": "intersection_agent", 
        "content": reasoning
    }]
    
    # Update state
    existing_trace = state.get("trace_events", [])
    all_trace = existing_trace + agent_trace_events
    
    print(f"🔍 {final_message}")
    
    return {
        **state,
        "agent_used": "intersection_agent",
        "reasoning": reasoning,
        "final_message": final_message,
        "trace_events": all_trace,
        "latest_trace_events": agent_trace_events,
        "new_tool_calls": [],  # This agent doesn't modify the room, just reports
        # Provide structured data for downstream resolution loops
        "intersections": intersections if len(furniture_blocks) > 1 else [],
        "collision_blocks": furniture_blocks,
    }

# --- Intelligent Router Agent ---
def router_agent(state: AgentState) -> AgentState:
    """
    Analyzes user input using LLM to determine which agents are needed and execution strategy.
    """
    print("🧠 --- Intelligent Router Agent ---")
    
    user_query = state['user_query']
    # attach simple intent for downstream prompts
    state['user_intent'] = analyze_user_intent(user_query)
    
    # Use LLM to analyze the query and determine agent requirements
    routing_prompt = f"""You are a routing system for interior design agents. Analyze the query and respond with ONLY valid JSON.

User Query: "{user_query}"

Available Agents:
- furniture_agent: furniture placement, selection, arrangement, moving, removing
- color_agent: wall colors, ceiling colors, floor colors, color schemes, palettes
- intersection_agent: checks for furniture collisions/intersections (automatically added after furniture changes)

Respond with valid JSON only:
{{"agents_needed": ["agent_name"], "execution_strategy": "sequential", "reasoning": "explanation", "complexity": "simple"}}

IMPORTANT: Do NOT include intersection_agent in your response - it will be automatically added after furniture_agent when needed.

Examples:
{{"agents_needed": ["furniture_agent"], "execution_strategy": "sequential", "reasoning": "Only furniture placement needed", "complexity": "simple"}}
{{"agents_needed": ["color_agent"], "execution_strategy": "sequential", "reasoning": "Only color change needed", "complexity": "simple"}}  
{{"agents_needed": ["furniture_agent", "color_agent"], "execution_strategy": "sequential", "reasoning": "Need furniture setup then color coordination", "complexity": "complex"}}"""
    
    try:
        import json
        llm_response = llm.invoke(routing_prompt)
        response_content = llm_response.content.strip()
        
        # Extract JSON from response if it's wrapped in markdown or other text
        if "```json" in response_content:
            json_start = response_content.find("```json") + 7
            json_end = response_content.find("```", json_start)
            response_content = response_content[json_start:json_end].strip()
        elif "{" in response_content:
            # Find the JSON object in the response
            json_start = response_content.find("{")
            json_end = response_content.rfind("}") + 1
            response_content = response_content[json_start:json_end]
        
        print(f"🤖 LLM Response: {response_content}")
        routing_decision = json.loads(response_content)
        
        state['agents_needed'] = routing_decision.get('agents_needed', ['furniture_agent'])
        state['execution_strategy'] = routing_decision.get('execution_strategy', 'sequential')
        state['routing_reasoning'] = routing_decision.get('reasoning', 'Default routing')
        state['complexity'] = routing_decision.get('complexity', 'simple')
        
        # Auto-append intersection agent after furniture agent
        if 'furniture_agent' in state['agents_needed'] and 'intersection_agent' not in state['agents_needed']:
            # Find furniture_agent position and insert intersection_agent right after it
            furniture_index = state['agents_needed'].index('furniture_agent')
            state['agents_needed'].insert(furniture_index + 1, 'intersection_agent')
            print(f"🔍 Auto-added intersection_agent after furniture_agent")
        
        print(f"🎯 Routing Decision:")
        print(f"   Agents Needed: {state['agents_needed']}")
        print(f"   Strategy: {state['execution_strategy']}")
        print(f"   Reasoning: {state['routing_reasoning']}")
        print(f"   Complexity: {state['complexity']}")
        
    except Exception as e:
        print(f"⚠️ LLM routing failed, using fallback: {e}")
        # Fallback to keyword-based routing
        user_query_lower = user_query.lower()
        furniture_keywords = ['furniture', 'sofa', 'chair', 'table', 'bed', 'add', 'remove', 'move', 'place', 'fully furnished', 'furnished']
        color_keywords = ['color', 'paint', 'wall', 'ceiling', 'floor', 'blue', 'red', 'green', 'palette', 'scheme', 'dark', 'cozy', 'cool', 'cooler', 'chilly', 'cold', 'icy', 'teal', 'aqua']
        
        has_furniture = any(keyword in user_query_lower for keyword in furniture_keywords)
        has_color = any(keyword in user_query_lower for keyword in color_keywords)
        
        if has_furniture and has_color:
            state['agents_needed'] = ['furniture_agent', 'color_agent']
            state['execution_strategy'] = 'sequential'
        elif has_furniture:
            state['agents_needed'] = ['furniture_agent']
            state['execution_strategy'] = 'sequential'
        elif has_color:
            state['agents_needed'] = ['color_agent']
            state['execution_strategy'] = 'sequential'
        else:
            state['agents_needed'] = ['furniture_agent']
            state['execution_strategy'] = 'sequential'
        
        state['routing_reasoning'] = 'Keyword-based fallback routing'
        state['complexity'] = 'simple'
        
        # Auto-append intersection agent after furniture agent (fallback routing)
        if 'furniture_agent' in state['agents_needed'] and 'intersection_agent' not in state['agents_needed']:
            furniture_index = state['agents_needed'].index('furniture_agent')
            state['agents_needed'].insert(furniture_index + 1, 'intersection_agent')
            print(f"🔍 Auto-added intersection_agent after furniture_agent (fallback)")
    
    return state

# --- Sequential Execution Logic ---
def execute_next_agent(state: AgentState) -> str:
    """Determines the next agent to execute in the sequence."""
    agents_needed = state.get('agents_needed', [])
    current_index = state.get('current_agent_index', 0)
    
    if current_index < len(agents_needed):
        next_agent = agents_needed[current_index]
        print(f"📋 Executing agent {current_index + 1}/{len(agents_needed)}: {next_agent}")
        return next_agent
    else:
        print("✅ All agents completed")
        return "__end__"  # Use __end__ instead of END for LangGraph

# --- Agent Coordinator ---
def agent_coordinator(state: AgentState) -> AgentState:
    """Coordinates the execution of multiple agents and tracks progress."""
    print("🎬 --- Agent Coordinator ---")
    
    # Initialize coordination fields if not present
    if 'current_agent_index' not in state:
        state['current_agent_index'] = 0
    if 'agents_completed' not in state:
        state['agents_completed'] = []
    if 'reasoning_trace' not in state:
        state['reasoning_trace'] = []
    
    # Add routing trace
    if 'routing_reasoning' in state:
        state['reasoning_trace'].append({
            "agent": "router",
            "step": "planning", 
            "reasoning": state['routing_reasoning'],
            "timestamp": "now",
            "agents_planned": state.get('agents_needed', [])
        })
    
    return state

# --- Agent Completion Handler ---
def complete_agent_execution(state: AgentState) -> AgentState:
    """Handles completion of an individual agent and prepares for next."""
    current_index = state.get('current_agent_index', 0)
    agents_needed = state.get('agents_needed', [])
    
    if current_index < len(agents_needed):
        completed_agent = agents_needed[current_index]
        
        # Mark agent as completed
        if 'agents_completed' not in state:
            state['agents_completed'] = []
        state['agents_completed'].append(completed_agent)
        
        # Store individual agent results for final summary
        if 'agent_results' not in state:
            state['agent_results'] = []
        state['agent_results'].append({
            "agent": completed_agent,
            "message": state.get('final_message', ''),
            "tool_calls": len([tc for tc in state.get('tool_calls', []) if tc.get('tool', '').startswith(completed_agent.split('_')[0])])
        })
        
        # Add completion to reasoning trace
        if 'reasoning_trace' not in state:
            state['reasoning_trace'] = []
        
        state['reasoning_trace'].append({
            "agent": completed_agent,
            "step": "completion",
            "reasoning": f"Agent {completed_agent} completed successfully",
            "timestamp": "now",
            "actions_taken": len(state.get('tool_calls', [])),
            "result": state.get('final_message', '')
        })
        
        # Move to next agent
        state['current_agent_index'] = current_index + 1
        
        print(f"✅ Completed {completed_agent} ({current_index + 1}/{len(agents_needed)})")
        
        if state['current_agent_index'] < len(agents_needed):
            next_agent = agents_needed[state['current_agent_index']]
            print(f"➡️  Moving to next agent: {next_agent}")
        else:
            # All agents completed - create combined final message
            agent_summaries = []
            for result in state.get('agent_results', []):
                agent_name = result['agent'].replace('_agent', '').title()
                agent_summaries.append(f"{agent_name} Agent: {result['message']}")
            
            combined_message = "\n\n".join(agent_summaries)
            state['final_message'] = combined_message
            print(f"🎯 Combined final message from all agents")
    
    return state

# --- Build the New Sequential Workflow ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("router_agent", router_agent)
workflow.add_node("agent_coordinator", agent_coordinator)
workflow.add_node("furniture_agent", furniture_agent)  
workflow.add_node("color_agent", color_agent)
workflow.add_node("complete_agent", complete_agent_execution)

# Add edges
workflow.set_entry_point("router_agent")
workflow.add_edge("router_agent", "agent_coordinator")
workflow.add_conditional_edges(
    "agent_coordinator", 
    execute_next_agent,
    {
        "furniture_agent": "furniture_agent",
        "color_agent": "color_agent", 
        "__end__": END
    }
)
workflow.add_edge("furniture_agent", "complete_agent")
workflow.add_edge("color_agent", "complete_agent")
workflow.add_conditional_edges(
    "complete_agent",
    execute_next_agent,
    {
        "furniture_agent": "furniture_agent",
        "color_agent": "color_agent",
        "__end__": END
    }
)

# Compile the workflow
app = workflow.compile()

# --- ReAct-style Trace Extraction Helpers ---
def extract_trace_events(messages: List[Any], agent_name: str) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for idx, message in enumerate(messages):
        content = getattr(message, 'content', None)
        if content:
            events.append({
                "type": "thought",
                "agent": agent_name,
                "index": idx,
                "content": content,
            })
        tool_calls = getattr(message, 'tool_calls', None)
        if tool_calls:
            for call in tool_calls:
                events.append({
                    "type": "action",
                    "agent": agent_name,
                    "tool": call.get("name"),
                    "args": call.get("args", {}),
                })
    return events

def convert_tool_calls_to_actions(tool_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []
    for tool_call in tool_calls:
        tool_name = tool_call.get("tool", "")
        args = tool_call.get("args", {})
        if tool_name == "add_furniture":
            furniture_name = args.get("furniture_name", "")
            furniture = get_furniture_by_name(furniture_name)
            if furniture:
                actions.append({
                    "action": "add_object",
                    "target": furniture["name"],
                    "value": {
                        "x": args.get("x", 0),
                        "y": args.get("y", 0),
                        "z": args.get("z", 0),
                        "width": furniture["width"],
                        "height": furniture["height"],
                        "depth": furniture["depth"],
                        "color": args.get("color", furniture["color"]),
                        "name": furniture["name"],
                    },
                })
        elif tool_name in ["change_wall_color", "change_ceiling_color", "change_floor_color"]:
            color_value = args.get("color", "#FFFFFF")
            if tool_name == "change_wall_color":
                wall = args.get("wall", "front").lower()
                if wall == "all":
                    for wall_target in ["wallFrontColor", "wallBackColor", "wallLeftColor", "wallRightColor"]:
                        actions.append({"action": "change_color", "target": wall_target, "value": color_value})
                else:
                    wall_mapping = {"front": "wallFrontColor", "back": "wallBackColor", "left": "wallLeftColor", "right": "wallRightColor"}
                    target = wall_mapping.get(wall, "wallFrontColor")
                    actions.append({"action": "change_color", "target": target, "value": color_value})
            elif tool_name == "change_ceiling_color":
                actions.append({"action": "change_color", "target": "ceilingColor", "value": color_value})
            elif tool_name == "change_floor_color":
                actions.append({"action": "change_color", "target": "floorColor", "value": color_value})
        elif tool_name == "move_furniture":
            actions.append({
                "action": "move_object",
                "target": args.get("furniture_name", ""),
                "value": {"x": args.get("new_x", 0), "y": args.get("new_y", 0), "z": args.get("new_z", 0)},
            })
        elif tool_name == "remove_furniture":
            actions.append({"action": "remove_object", "target": args.get("furniture_name", ""), "value": {}})
    return actions

def apply_actions_to_room_state(room_state: Dict[str, Any], actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Apply actions to a room_state dict to maintain authoritative backend positions.
    """
    next_state = {**room_state}
    blocks = [dict(b) for b in room_state.get("blocks", [])]
    for action in actions:
        a = action.get("action")
        target = action.get("target")
        value = action.get("value", {})
        if a == "move_object":
            for b in blocks:
                if b.get("name", "").lower() == str(target).lower():
                    b["x"] = float(value.get("x", b.get("x", 0)))
                    b["y"] = float(value.get("y", b.get("y", 0)))
                    b["z"] = float(value.get("z", b.get("z", 0)))
                    break
        elif a == "add_object":
            # not needed for collision passes, but keep behavior consistent
            name = value.get("name") or target or "Object"
            lib = get_furniture_by_name(str(name)) or {}
            blocks.append({
                "name": lib.get("name", name),
                "x": float(value.get("x", 0)),
                "y": float(value.get("y", 0)),
                "z": float(value.get("z", 0)),
                "width": float(value.get("width", lib.get("width", 1))),
                "height": float(value.get("height", lib.get("height", 1))),
                "depth": float(value.get("depth", lib.get("depth", 1))),
                "color": value.get("color", lib.get("color", "#8B4513")),
            })
        elif a == "remove_object":
            blocks = [b for b in blocks if b.get("name", "").lower() != str(target).lower()]
    next_state["blocks"] = blocks
    return next_state

def stream_workflow(initial_state: AgentState):
    # Check if this is a clarification response with continuation instructions
    user_query = initial_state.get("user_query", "")
    if "[CONTINUE_WITH_AGENTS:" in user_query:
        print(f"🔄 Detected continuation instruction in query: {user_query}")
        
        # Extract and set up continuation agents directly
        start_idx = user_query.find('[CONTINUE_WITH_AGENTS:') + len('[CONTINUE_WITH_AGENTS:')
        end_idx = user_query.find(']', start_idx)
        if end_idx != -1:
            agents_str = user_query[start_idx:end_idx].strip()
            continuation_agents = [agent.strip() for agent in agents_str.split(',') if agent.strip()]
            
            print(f"🔄 Extracted continuation agents: {continuation_agents}")
            
            # Clean the user query
            clean_query = user_query[:user_query.find('[CONTINUE_WITH_AGENTS:')].strip()
            
            # Set up minimal orchestrator planning for continuation
            yield {"type": "orchestrator_plan", "content": f"Continuing with remaining agents: {', '.join(continuation_agents)}"}
            
            # Set up state for continuation execution
            state = dict(initial_state)
            state["user_query"] = clean_query
            state["agents_needed"] = continuation_agents  
            state["current_agent_index"] = 0
            state["execution_strategy"] = "sequential"
            state["routing_reasoning"] = "Continuation after clarification"
            state["complexity"] = "simple"
            
            yield {
                "type": "routing", 
                "agents_needed": continuation_agents,
                "reasoning": "Continuation after clarification",
                "complexity": "simple",
            }
            
            # Skip normal orchestrator and router steps, go directly to agent execution
        else:
            # Fallback if parsing fails
            print("🔄 Failed to parse continuation instruction, using normal flow")
            # Continue with normal flow below
            user_query = initial_state.get("user_query", "")
    else:
        # Normal workflow - Initial orchestrator planning (pre-run)
        planning_text = orchestrator_planner(initial_state)
        if planning_text:
            yield {"type": "orchestrator_plan", "content": planning_text}

        # Router step
        state = router_agent(dict(initial_state))
        yield {
            "type": "routing",
            "agents_needed": state.get("agents_needed", []),
            "reasoning": state.get("routing_reasoning", ""),
            "complexity": state.get("complexity", "simple"),
        }

    # Common agent coordination and execution
    if 'state' not in locals():
        state = router_agent(dict(initial_state))
    
    state = agent_coordinator(state)

    # Sequential execution
    while True:
        next_step = execute_next_agent(state)
        if next_step == "__end__":
            break

        yield {"type": "agent_start", "agent": next_step}

        if next_step == "furniture_agent":
            result_state = furniture_agent(state)
        elif next_step == "color_agent":
            result_state = color_agent(state)
        elif next_step == "intersection_agent":
            result_state = intersection_agent(state)
        else:
            result_state = state

        # Check if agent needs clarification
        if result_state.get("needs_clarification", False):
            yield {
                "type": "clarification_needed",
                "agent": next_step,
                "clarification_type": result_state.get("clarification_type", ""),
                "message": result_state.get("final_message", ""),
                "questions": result_state.get("clarification_questions", [])
            }
            return  # Stop the workflow until clarification is provided

        # Stream fine-grained ReAct events captured from the agent
        latest_trace = result_state.get("latest_trace_events", [])
        for ev in latest_trace:
            if ev.get("type") == "thought":
                yield {"type": "thought", "agent": next_step, "content": ev.get("content", "")}
            elif ev.get("type") == "action":
                yield {"type": "action", "agent": next_step, "tool": ev.get("tool"), "args": ev.get("args", {})}

        tool_calls = result_state.get("new_tool_calls", [])
        # Only allow tools appropriate for this agent
        allowed_tools_by_agent = {
            "furniture_agent": {"add_furniture", "move_furniture", "remove_furniture", "list_available_furniture"},
            "color_agent": {"change_wall_color", "change_ceiling_color", "change_floor_color", "analyze_room_colors", "suggest_color_palette"},
        }
        allowed = allowed_tools_by_agent.get(next_step, set())
        # During collision resolution, restrict furniture tools to movement/removal only (avoid duplicate adds)
        if result_state.get("collision_resolution_mode") and next_step == "furniture_agent":
            allowed = {"move_furniture", "remove_furniture"}
        filtered_calls = [c for c in tool_calls if c.get("tool") in allowed]
        for call in filtered_calls:
            yield {"type": "action", "agent": next_step, "tool": call.get("tool"), "args": call.get("args", {})}

        actions = convert_tool_calls_to_actions(filtered_calls)
        # Do not apply add_object during collision resolution passes
        if result_state.get("collision_resolution_mode"):
            actions = [a for a in actions if a.get("action") != "add_object"]
        if actions:
            yield {"type": "actions", "agent": next_step, "actions": actions}
            # Keep backend room_state authoritative and in sync with frontend
            base_room = result_state.get("room_state") or state.get("room_state") or {}
            updated_room = apply_actions_to_room_state(base_room, actions)
            result_state["room_state"] = updated_room

        # Conditional loop: if intersection_agent found collisions, schedule a resolution loop via furniture_agent
        if next_step == "intersection_agent":
            pairs = result_state.get("intersections", [])
            if pairs:
                loop_count = int(result_state.get("collision_loop_count", 0)) + 1
                if loop_count <= 5:
                    yield {"type": "thought", "agent": "intersection_agent", "content": f"{len(pairs)} collision(s) detected → scheduling furniture_agent to resolve (pass {loop_count})."}
                    # Attach pairs so furniture_agent receives them
                    result_state["collision_pairs"] = pairs
                    result_state["collision_loop_count"] = loop_count
                    result_state["collision_resolution_mode"] = True
                    # Insert furniture_agent and another intersection_agent to re-check
                    idx = result_state.get("current_agent_index", 0)
                    agents_needed = list(result_state.get("agents_needed", []))
                    agents_needed.insert(idx + 1, "furniture_agent")
                    agents_needed.insert(idx + 2, "intersection_agent")
                    result_state["agents_needed"] = agents_needed
                else:
                    yield {"type": "thought", "agent": "intersection_agent", "content": "Max collision resolution passes reached. Proceeding."}

        state = complete_agent_execution(result_state)
        yield {"type": "agent_complete", "agent": next_step}

    # Final summary
    yield {
        "type": "final",
        "message": state.get("final_message", "Design request processed"),
        "agents_completed": state.get("agents_completed", []),
    }


# --- FastAPI Application ---
fastapi_app = FastAPI(title="Simple Multi-Agent Design System")

@fastapi_app.post("/design", response_model=DesignResponse)
async def process_design_request(request: DesignRequest):
    """Process a design request using the multi-agent system."""
    try:
        # Convert room_state to dict for the workflow
        room_dict = request.room_state.model_dump()
        
        # Initialize state
        initial_state = {
            "user_query": request.user_input,
            "room_state": room_dict,
            "actions": [],
            "agent_used": "",
            "reasoning": "",
            "final_message": ""
        }
        
        # Run the workflow
        result = app.invoke(initial_state)
        
        return DesignResponse(
            message=result.get("final_message", "Design request processed"),
            actions=result.get("actions", []),
            agent_used=result.get("agent_used", "unknown"),
            reasoning=result.get("reasoning", "No reasoning provided")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@fastapi_app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "system": "simple-multi-agent-design",
        "agents": ["router", "furniture", "color"],
        "framework": "LangGraph + ReAct"
    }

@fastapi_app.post("/design-stream")
async def process_design_request_stream(request: DesignRequest):
    """Stream ReAct-style reasoning and actions as Server-Sent Events (SSE-like JSON lines)."""
    try:
        initial_state: AgentState = {
            "user_query": request.user_input,
            "room_state": request.room_state.model_dump(),
            "actions": [],
            "agent_used": "",
            "reasoning": "",
            "final_message": "",
            "tool_calls": [],
            "agents_needed": [],
            "execution_strategy": "sequential",
            "routing_reasoning": "",
            "complexity": "simple",
            "current_agent_index": 0,
            "agents_completed": [],
            "reasoning_trace": [],
            "user_intent": {},
        }

        import json

        def event_generator():
            for event in stream_workflow(initial_state):
                yield json.dumps(event) + "\n"

        return StreamingResponse(event_generator(), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing streamed request: {str(e)}")

# --- Command Line Interface ---
def run_cli():
    """Run the system in command line mode for testing."""
    print("🏠 Simple Multi-Agent Interior Design System")
    print("Type 'quit' to exit\n")
    
    # Default room state for CLI testing
    default_room = {
        "width": 12,
        "length": 12, 
        "height": 8,
        "floorColor": "#D2691E",
        "ceilingColor": "#FFFFFF",
        "wallFrontColor": "#F5F5DC",
        "wallBackColor": "#F5F5DC", 
        "wallLeftColor": "#F5F5DC",
        "wallRightColor": "#F5F5DC",
        "blocks": []
    }
    
    while True:
        user_input = input("\n💬 Enter your design request: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
            
        if not user_input:
            continue
            
        # Initialize state
        initial_state = {
            "user_query": user_input,
            "room_state": default_room,
            "actions": [],
            "agent_used": "",
            "reasoning": "",
            "final_message": ""
        }
        
        try:
            # Run the workflow
            result = app.invoke(initial_state)
            
            print(f"\n✅ {result.get('final_message', 'Request processed')}")
            print(f"🤖 Agent Used: {result.get('agent_used', 'unknown')}")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")

# --- Main Execution ---
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "server":
        # Run FastAPI server
        uvicorn.run(fastapi_app, host="0.0.0.0", port=8002)
    