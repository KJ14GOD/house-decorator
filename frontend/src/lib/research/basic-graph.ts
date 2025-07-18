import { StateGraph } from "@langchain/langgraph";
import { BasicResearchState } from "./state";

// Simple node function - just logs and returns state
async function startResearch(state: BasicResearchState): Promise<Partial<BasicResearchState>> {
  console.log("Starting research...", state);
  return {
    currentStep: "research_started",
    messages: [...state.messages, "Research has begun"]
  };
}

// Create the simplest possible graph
export function createBasicGraph() {
  const workflow = new StateGraph({
    channels: {
      messages: {
        value: (x: string[], y: string[]) => [...(x || []), ...(y || [])],
        default: () => []
      },
      currentStep: {
        value: (x: string, y: string) => y || "initial",
        default: () => "initial"
      }
    }
  });

  // Add one node
  workflow.addNode("start_research", startResearch);
  
  // Add edges to make node reachable
  workflow.addEdge("__start__", "start_research");
  workflow.addEdge("start_research", "__end__");

  return workflow.compile();
} 