import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valParts] = trimmed.split('=');
    const value = valParts.join('=');
    if (key === 'SUPABASE_URL') supabaseUrl = value.trim();
    if (key === 'SUPABASE_ANON_KEY') supabaseAnonKey = value.trim();
  }
}

// Fallback to hardcoded values if not found in env
supabaseUrl = supabaseUrl || "https://ypsplpqawhxqhowzzulw.supabase.co";
supabaseAnonKey = supabaseAnonKey || "sb_publishable_wxTzEjX3LCse2q-K_ta00w_NAyStvLq";

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dishesToSeed = [
  {
    name: 'Artisan Pizza',
    description: 'Wood-fired pizza with fresh mozzarella, basil, and San Marzano tomatoes.',
    price: 22.99,
    category: 'Main',
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    model_url: '/models/pizza.glb',
    poster_url: '/models/pizza-placeholder.webp',
    ios_src: '/api/models/pizza.usdz',
    is_available: true
  },
  {
    name: 'Chocolate Chip Cookie',
    description: 'Freshly baked giant chocolate chip cookie, warm and gooey in the center.',
    price: 8.99,
    category: 'Dessert',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
    model_url: '/models/cookie.glb',
    poster_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
    ios_src: '/api/models/cookie.usdz',
    is_available: true
  },
  {
    name: 'Chicken Shawarma Wrap',
    description: 'Tender sliced marinated chicken wrapped in flatbread with homemade garlic sauce, wild pickles, and fries.',
    price: 14.99,
    category: 'Main',
    image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600',
    model_url: '/models/shawarma_deal-v2.glb',
    poster_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600',
    ios_src: '/api/models/shawarma_deal-v2.usdz',
    is_available: true
  },
  {
    name: 'Oasis Creamed Coffee',
    description: 'Rich dark espresso blend topped with a luscious dollop of fresh cream and a dash of cinnamon.',
    price: 6.99,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
    model_url: '/models/creamed_coffee.glb',
    poster_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
    ios_src: '/api/models/creamed_coffee.usdz',
    is_available: true
  },
  {
    name: 'Classic Mug Coffee',
    description: 'Freshly brewed house blend medium-roast black coffee, served hot in a ceramic mug.',
    price: 4.99,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
    model_url: '/models/coffee_mug_school_project.glb',
    poster_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
    ios_src: '/api/models/coffee_mug_school_project.usdz',
    is_available: true
  },
  {
    name: 'Fruit Cream Cake Slice',
    description: 'Light vanilla sponge cake layered with fresh whipped cream and a medley of seasonal sweet berries.',
    price: 9.99,
    category: 'Dessert',
    image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
    model_url: '/models/fruit_cream_cake.glb',
    poster_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
    ios_src: '/api/models/fruit_cream_cake.usdz',
    is_available: true
  },
  {
    name: 'Oasis Latte Art',
    description: 'Artisan rich espresso layered with silky textured microfoam steam milk, complete with a hand-poured heart rosetta.',
    price: 5.99,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600',
    model_url: '/models/latte_art.glb',
    poster_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600',
    ios_src: '/api/models/latte_art.usdz',
    is_available: true
  }
];

async function main() {
  // Sign in as staff/admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'huzaifasiddiqui0029@gmail.com',
    password: '@r$#!786'
  });

  if (authError) {
    console.error('Failed to sign in as staff/admin:', authError.message);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log('Authenticated successfully. JWT token acquired.');

  // Create an authorized client
  const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  for (const dish of dishesToSeed) {
    // Check if dish exists
    const { data: existing, error: findError } = await authSupabase
      .from('dishes')
      .select('id')
      .eq('name', dish.name);

    if (findError) {
      console.error(`Error querying dish "${dish.name}":`, findError.message);
      continue;
    }

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      const { error: updateError } = await authSupabase
        .from('dishes')
        .update(dish)
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update dish "${dish.name}":`, updateError.message);
      } else {
        console.log(`Updated dish "${dish.name}" (ID: ${id})`);
      }
    } else {
      const { data: inserted, error: insertError } = await authSupabase
        .from('dishes')
        .insert(dish)
        .select();

      if (insertError) {
        console.error(`Failed to insert dish "${dish.name}":`, insertError.message);
      } else {
        console.log(`Inserted new dish "${dish.name}"`);
      }
    }
  }

  console.log('Seeding finished.');
}

main().catch(err => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
