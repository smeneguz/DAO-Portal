import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test direct API connectivity
    const response = await fetch('http://localhost:8000/api/v1/daos/1');
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const dao = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'API connectivity test successful',
      dao: {
        id: dao.id,
        name: dao.name,
        chain_id: dao.chain_id
      }
    });
  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
