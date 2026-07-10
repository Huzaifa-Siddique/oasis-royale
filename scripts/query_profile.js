const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ypsplpqawhxqhowzzulw.supabase.co';
const supabaseKey = 'sb_publishable_wxTzEjX3LCse2q-K_ta00w_NAyStvLq'; // anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Profiles sample data and columns:", JSON.stringify(data, null, 2));
  }
}

run();
