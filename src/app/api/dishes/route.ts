import { NextResponse } from 'next/server';

// Simple dev API returning a hard-coded list of dishes
export async function GET() {
  const dishes = [
    {
      id: 'pizza-1',
      name: 'Margherita',
      price: 12.5,
      is_available: true,
      model_url: '/models/pizza.glb',
      poster_url: '/models/pizza-placeholder.webp',
      ios_src: '/models/pizza.usdz',
    },
  ];

  const response = NextResponse.json(dishes, { status: 200 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
