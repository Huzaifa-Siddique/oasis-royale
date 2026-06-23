const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ypsplpqawhxqhowzzulw.supabase.co';
const supabaseKey = 'sb_publishable_wxTzEjX3LCse2q-K_ta00w_NAyStvLq'; // anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('category');
  
  if (error) {
    console.error("Error fetching dishes:", error);
  } else {
    console.log("Dishes count:", data.length);
    console.log("Dishes data:", JSON.stringify(data, null, 2));
  }
}

run();
