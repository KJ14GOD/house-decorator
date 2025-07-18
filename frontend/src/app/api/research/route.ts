import { NextRequest, NextResponse } from 'next/server';
import { createResearchGraph } from '@/lib/research/research-graph';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle both message and messages formats
    let researchTopic: string;
    
    if (body.message) {
      // Single message format
      researchTopic = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      // Messages array format
      const lastUserMessage = [...body.messages].reverse().find((msg: any) => msg.role === 'user');
      if (!lastUserMessage) {
        return NextResponse.json({ error: 'No user message found in messages array.' }, { status: 400 });
      }
      researchTopic = lastUserMessage.content;
    } else {
      return NextResponse.json({ error: 'No message or messages provided.' }, { status: 400 });
    }

    console.log('Starting deep research workflow...');
    console.log(`Research topic: ${researchTopic}`);
    
    // Track research start time
    const researchStartTime = Date.now();
    
    // Create and run the research graph
    const graph = createResearchGraph();
    const result = await graph.invoke({ 
      messages: [researchTopic],
      current_step: "initial"
    });

    console.log('Research workflow completed');
    console.log(`Research summary:`, result.research_summary);
    console.log(`Sources found: ${result.sources_gathered?.length || 0}`);

    // Extract URLs and sources from the detailed findings
    const extractedSources: Array<{url: string, title: string, domain: string, snippet: string}> = [];
    const extractedURLs = new Set<string>();
    
    // Parse detailed findings to extract URLs and sources
    if (result.detailed_findings) {
      result.detailed_findings.forEach((finding: any) => {
        if (finding.content) {
          // Extract URLs from the content using regex
          const urlRegex = /https?:\/\/[^\s\)\]\}\n\r"'<>]+/g;
          const urls = finding.content.match(urlRegex);
          if (urls) {
            urls.forEach((url: string) => {
              extractedURLs.add(url);
              extractedSources.push({
                url: url,
                title: `Source from ${finding.query || 'research'}`,
                domain: new URL(url).hostname,
                snippet: `Found during research for: ${finding.query || 'unknown query'}`
              });
            });
          }
        }
      });
    }

    // Calculate total research time
    const totalResearchTime = Math.round((Date.now() - researchStartTime) / 1000);
    
    // Create beautifully formatted research report with cards and components
    const formattedReport = `
# 🔬 Deep Research Report: ${researchTopic}

## Research Statistics
**Total Research Time:** ${totalResearchTime} seconds  
**Total Queries:** ${result.total_queries_completed || 0}  
**Research Loops:** ${result.research_loop_count || 0}  
**Sources Analyzed:** ${extractedSources.length}  
**Detailed Findings:** ${result.detailed_findings?.length || 0}

---

##  Key Sources Discovered

${extractedSources.map((source: any, index: number) => `
### Source ${index + 1}
**URL:** ${source.url}  
**Title:** ${source.title}  
**Domain:** ${source.domain}  
**Snippet:** ${source.snippet}
`).join('\n\n') || 'No sources found'}

---

##  Research Analysis

${result.research_results?.map((summary: any, index: number) => `
### Analysis ${index + 1}
${summary}
`).join('\n\n') || 'No research summaries'}

---

## Research Summary
${result.research_summary ? JSON.stringify(result.research_summary, null, 2) : 'No research summary'}

---

## Final Research Report
${result.final_answer || 'No final answer generated'}

---

*This comprehensive research report shows all URLs, findings, and detailed analysis collected during the deep research process.*
`;

    // Return streaming response with raw dump
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the formatted research report
        const resultData = `data: ${JSON.stringify({
          type: 'result',
          content: formattedReport
        })}\n\n`;
        controller.enqueue(encoder.encode(resultData));
        
        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error(' Error in /api/research:', error);
    return NextResponse.json({ 
      error: 'Research workflow failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}