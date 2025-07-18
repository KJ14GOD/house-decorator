// Simple JavaScript LangGraph implementation to test functionality
const { StateGraph } = require("@langchain/langgraph");

// Simple node function
async function startResearch(state) {
  console.log("Starting research...", state);
  return {
    currentStep: "research_started",
    messages: [...state.messages, "Research has begun"]
  };
}

// Create basic graph
function createBasicGraph() {
  const workflow = new StateGraph({
    channels: {
      messages: {
        value: (x, y) => [...(x || []), ...(y || [])],
        default: () => []
      },
      currentStep: {
        value: (x, y) => y || "initial",
        default: () => "initial"
      }
    }
  });

  // Add node
  workflow.addNode("start_research", startResearch);
  
  // Add edges
  workflow.addEdge("__start__", "start_research");
  workflow.addEdge("start_research", "__end__");

  return workflow.compile();
}

// Test the graph
async function testGraph() {
  try {
    const graph = createBasicGraph();
    console.log("Graph created successfully");
    
    const result = await graph.invoke({
      messages: ["Initial message"],
      currentStep: "initial"
    });
    
    console.log("Graph execution result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { createBasicGraph, testGraph }; 