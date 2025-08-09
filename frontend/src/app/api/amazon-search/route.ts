import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // You'll need to add your Rainforest API key to your environment variables
    const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
    console.log("RAINFOREST_API_KEY:", RAINFOREST_API_KEY);
    
    if (!RAINFOREST_API_KEY) {
      return NextResponse.json({ 
        error: 'Rainforest API key not configured',
        message: 'Please add RAINFOREST_API_KEY to your environment variables'
      }, { status: 500 });
    }

    // Call Rainforest API
    const response = await fetch('https://api.rainforestapi.com/request', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Using URLSearchParams for proper query string formatting
      body: null,
    });

    const url = new URL('https://api.rainforestapi.com/request');
    url.searchParams.append('api_key', RAINFOREST_API_KEY);
    url.searchParams.append('type', 'search');
    url.searchParams.append('amazon_domain', 'amazon.com');
    url.searchParams.append('search_term', query);
    url.searchParams.append('limit', '30');

    const rainforestResponse = await fetch(url.toString());
    
    if (!rainforestResponse.ok) {
      throw new Error(`Rainforest API error: ${rainforestResponse.status}`);
    }

    const data = await rainforestResponse.json();
    
    // Format the response for the frontend
    const formattedProducts = data.search_results?.map((item: any) => ({
      asin: item.asin,
      title: item.title,
      price: {
        current_price: item.price?.value || 0,
        currency: item.price?.currency || 'USD',
        original_price: item.price?.original_value || 0
      },
      rating: item.rating || 0,
      ratings_total: item.ratings_total || 0,
      image: item.image || '',
      link: item.link || '',
      prime: item.prime || false,
      availability_status: item.availability_status || '',
      delivery: item.delivery || {},
      categories: item.categories || []
    })) || [];

    return NextResponse.json({
      products: formattedProducts,
      total_results: data.search_results?.length || 0,
      search_url: data.search_url || '',
      query: query
    });

  } catch (error) {
    console.error('Amazon search error:', error);
    return NextResponse.json({ 
      error: 'Failed to search Amazon products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 