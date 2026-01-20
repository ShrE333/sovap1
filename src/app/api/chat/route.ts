import { NextResponse } from 'next/server';
import { RAGEngine } from '@/lib/engine/rag-engine';

export async function POST(req: Request) {
    try {
        const { message, topicId, state } = await req.json();

        // Phase 4: Retrieve Context via Qdrant (RAG)
        const rag = RAGEngine.getInstance();
        const context = await rag.retrieveContext(message, topicId);

        // In a real implementation, we would feed this context to the LLM (Gemma 2).
        // const prompt = `Context: ${JSON.stringify(context)} \n Question: ${message}`;
        // const response = await llm.generate(prompt);

        // Mock response utilizing RAG source
        const mockResponse = `(Source: ${context[0].source}) Based on our knowledge base: ${context[0].text}\n\nRegarding your question about "${message}", ensure you are cross-referencing this with the lab material.`;

        return NextResponse.json({ response: mockResponse });
    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
    }
}
