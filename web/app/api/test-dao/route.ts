// /api/test-dao route to test proxy functionality
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API route: Testing backend connection...');
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${backendUrl}/daos/1`);
    
    console.log(`API route: Backend response status: ${response.status}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('API route: Successfully fetched data from backend');
    
    return NextResponse.json({
      success: true,
      data,
      source: 'Next.js API route proxy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
