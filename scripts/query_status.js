const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ypsplpqawhxqhowzzulw.supabase.co';
const supabaseKey = 'sb_publishable_wxTzEjX3LCse2q-K_ta00w_NAyStvLq'; // anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('restaurant_status')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error("Error fetching status:", error);
  } else {
    console.log("Restaurant status columns and data:", JSON.stringify(data, null, 2));
  }
}

run();
