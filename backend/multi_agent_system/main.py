"""
Main FastAPI server that uses the simple multi-agent system
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Import our simple agents system
from simple_agents import app as workflow_app, DesignRequest, DesignResponse, stream_workflow

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Simple Multi-Agent Interior Design API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "system": "simple-multi-agent-design",
        "agents": ["router", "furniture", "color"],
        "framework": "LangGraph + ReAct",
        "endpoints": ["/multi-agent-design", "/health"]
    }

@app.post("/multi-agent-design", response_model=DesignResponse)
async def multi_agent_design(request: DesignRequest):
    """
    Process a design request using the simple multi-agent system.
    This endpoint maintains compatibility with the frontend.
    """
    try:
        # Convert room_state to dict for the workflow
        room_dict = request.room_state.dict()
        
        # Initialize state for the workflow
        initial_state = {
            "user_query": request.user_input,
            "room_state": room_dict,
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
            "reasoning_trace": []
        }
        
        # Run the simple multi-agent workflow
        result = workflow_app.invoke(initial_state)
        
        # Parse actions from tool calls instead of text parsing
        actions = []
        tool_calls = result.get("tool_calls", [])
        print(f"Processing {len(tool_calls)} tool calls: {tool_calls}")
        
        for tool_call in tool_calls:
            tool_name = tool_call.get("tool", "")
            args = tool_call.get("args", {})
            
            if tool_name == "add_furniture":
                # Get furniture details from library
                furniture_name = args.get("furniture_name", "")
                from simple_agents import get_furniture_by_name
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
                            "name": furniture["name"]
                        }
                    })
                    
            elif tool_name in ["change_wall_color", "change_ceiling_color", "change_floor_color"]:
                color_value = args.get("color", "#FFFFFF")
                
                if tool_name == "change_wall_color":
                    wall = args.get("wall", "front").lower()
                    if wall == "all":
                        # Create actions for all walls
                        for wall_target in ["wallFrontColor", "wallBackColor", "wallLeftColor", "wallRightColor"]:
                            actions.append({
                                "action": "change_color",
                                "target": wall_target,
                                "value": color_value
                            })
                    else:
                        wall_mapping = {
                            "front": "wallFrontColor",
                            "back": "wallBackColor",
                            "left": "wallLeftColor", 
                            "right": "wallRightColor"
                        }
                        target = wall_mapping.get(wall, "wallFrontColor")
                        actions.append({
                            "action": "change_color",
                            "target": target,
                            "value": color_value
                        })
                        
                elif tool_name == "change_ceiling_color":
                    actions.append({
                        "action": "change_color",
                        "target": "ceilingColor",
                        "value": color_value
                    })
                    
                elif tool_name == "change_floor_color":
                    actions.append({
                        "action": "change_color",
                        "target": "floorColor",
                        "value": color_value
                    })
            
            elif tool_name == "move_furniture":
                actions.append({
                    "action": "move_object",
                    "target": args.get("furniture_name", ""),
                    "value": {
                        "x": args.get("new_x", 0),
                        "y": args.get("new_y", 0),
                        "z": args.get("new_z", 0)
                    }
                })
                
            elif tool_name == "remove_furniture":
                actions.append({
                    "action": "remove_object",
                    "target": args.get("furniture_name", ""),
                    "value": {}
                })
        
        print(f"Extracted {len(actions)} actions from tool calls: {actions}")
        
        # Create a comprehensive response
        agents_used = result.get("agents_completed", [])
        reasoning_trace = result.get("reasoning_trace", [])
        
        # Create detailed reasoning summary
        reasoning_summary = []
        reasoning_summary.append(f"🎯 Routing: {result.get('routing_reasoning', 'N/A')}")
        reasoning_summary.append(f"📋 Agents Used: {', '.join(agents_used)}")
        reasoning_summary.append(f"🔧 Complexity: {result.get('complexity', 'simple')}")
        reasoning_summary.append(f"⚡ Actions Generated: {len(actions)}")
        
        if reasoning_trace:
            reasoning_summary.append("\n📊 Reasoning Trace:")
            for i, trace in enumerate(reasoning_trace, 1):
                agent = trace.get('agent', 'unknown')
                step = trace.get('step', 'unknown')
                reasoning = trace.get('reasoning', 'N/A')
                reasoning_summary.append(f"  {i}. [{agent}] {step}: {reasoning}")
        
        return DesignResponse(
            message=result.get("final_message", "Multi-agent design process completed successfully"),
            actions=actions,
            agent_used=", ".join(agents_used) if agents_used else result.get("agent_used", "unknown"),
            reasoning="\n".join(reasoning_summary)
        )
        
    except Exception as e:
        print(f"Error in multi-agent design: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Multi-agent system error: {str(e)}")

@app.post("/multi-agent-design-stream")
async def multi_agent_design_stream(request: DesignRequest):
    """Stream ReAct-style reasoning and actions as JSON lines."""
    try:
        initial_state = {
            "user_query": request.user_input,
            "room_state": request.room_state.dict(),
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

        def generator():
            for event in stream_workflow(initial_state):
                yield json.dumps(event) + "\n"

        return StreamingResponse(generator(), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-agent system stream error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)