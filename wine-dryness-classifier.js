// Supabase Edge Function a borok szárazsági fokának meghatározására Perplexity API segítségével
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Konfiguráció
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Szárazsági fokok
const DRYNESS_LEVELS = [
  'Száraz',
  'Félszáraz',
  'Félédes', 
  'Édes',
  'Brut',
  'Extra Brut',
  'Brut Nature'
];

// Perplexity API-hoz a lekérdező függvény
async function askPerplexity(query) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "sonar-medium-online",
        messages: [
          {
            role: "system",
            content: `Te egy borszakértő vagy. A feladatod, hogy meghatározd a borok szárazsági fokát a következő kategóriák egyikébe sorolva:
            - Száraz (dry)
            - Félszáraz (off-dry / semi-dry)
            - Félédes (semi-sweet)
            - Édes (sweet)
            - Brut / Extra Brut / Brut Nature (pezsgőknél)
            
            Használj szakmai forrásokat a válasz meghatározásához. Válaszodban csak a kategória nevét add meg, semmi mást.`
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    throw error;
  }
}

// Fő függvény a bor szárazsági fokának meghatározására
async function classifyWineDryness(productName, grapeVariety) {
  const query = `Milyen szárazsági fokú a következő bor: "${productName}"${grapeVariety ? `, amelynek szőlőfajtája: ${grapeVariety}` : ''}? Válaszodban csak a kategória nevét add meg a következők közül: Száraz, Félszáraz, Félédes, Édes, Brut, Extra Brut, Brut Nature.`;
  
  const perplexityResponse = await askPerplexity(query);
  
  // Normalizáljuk és ellenőrizzük a választ
  const normalizedResponse = normalizeResponse(perplexityResponse);
  
  return normalizedResponse;
}

// Válasz normalizálása és ellenőrzése
function normalizeResponse(response) {
  // Eltávolítjuk a felesleges szövegrészeket, csak a kategória nevét tartjuk meg
  const cleanedResponse = response.replace(/^a bor |^ez a bor |^ez egy |^a |^ez |válasz: |kategória: /gi, '').trim();
  
  // Ellenőrizzük, hogy a válasz tartalmaz-e valamelyik szárazsági szintet
  for (const level of DRYNESS_LEVELS) {
    if (cleanedResponse.toLowerCase().includes(level.toLowerCase())) {
      return level;
    }
  }
  
  // Ha brut/extra dry/stb szerepel benne, akkor azt is kezeljük
  if (cleanedResponse.toLowerCase().includes('brut nature')) {
    return 'Brut Nature';
  } else if (cleanedResponse.toLowerCase().includes('extra brut')) {
    return 'Extra Brut';
  } else if (cleanedResponse.toLowerCase().includes('brut')) {
    return 'Brut';
  } else if (cleanedResponse.toLowerCase().includes('dry') || cleanedResponse.toLowerCase().includes('száraz')) {
    return 'Száraz';
  } else if (cleanedResponse.toLowerCase().includes('off-dry') || 
            cleanedResponse.toLowerCase().includes('semi-dry') || 
            cleanedResponse.toLowerCase().includes('félszáraz')) {
    return 'Félszáraz';
  } else if (cleanedResponse.toLowerCase().includes('semi-sweet') || 
            cleanedResponse.toLowerCase().includes('félédes')) {
    return 'Félédes';
  } else if (cleanedResponse.toLowerCase().includes('sweet') || 
            cleanedResponse.toLowerCase().includes('édes')) {
    return 'Édes';
  }
  
  // Ha nem találtunk egyezést, visszaadjuk a teljes tisztított választ
  return cleanedResponse;
}

// Függvény egy termék frissítésére
async function updateProductDryness(supabase, productId, drynessLevel) {
  const { error } = await supabase
    .from('shopify_products')
    .update({ dryness_level: drynessLevel })
    .eq('id', productId);
  
  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }
  
  return { success: true, productId, drynessLevel };
}

// Fő handler
Deno.serve(async (req) => {
  try {
    // CORS kezelése
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        status: 204,
      });
    }

    // Csak POST kéréseket fogadunk
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Request body kiolvasása
    const { productId, limit } = await req.json();
    
    // Supabase kliens inicializálása
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Ha egy specifikus termék ID-t kaptunk
    if (productId) {
      const { data: product, error } = await supabase
        .from('shopify_products')
        .select('id, Title, "Product Type (Custom)", Szőlőfatja, normalized_grape_varieties')
        .eq('id', productId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Ellenőrizzük, hogy bor vagy pezsgő-e a termék
      const productType = product['Product Type (Custom)'] || '';
      if (!productType.toLowerCase().includes('bor') && 
          !productType.toLowerCase().includes('pezsgő') &&
          !productType.toLowerCase().includes('champagne') &&
          !productType.toLowerCase().includes('wine')) {
        return new Response(
          JSON.stringify({ error: 'Not a wine or champagne product', productId, productType }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      
      // Szőlőfajta kiválasztása - először a normalizált majd az eredeti
      const grapeVariety = product.normalized_grape_varieties || product.Szőlőfatja || '';
      
      // Szárazsági fok meghatározása
      const drynessLevel = await classifyWineDryness(product.Title, grapeVariety);
      
      // Termék frissítése
      const result = await updateProductDryness(supabase, productId, drynessLevel);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    } 
    // Ha nincs specifikus ID, akkor a még nem kategorizált borokat dolgozzuk fel
    else {
      const queryLimit = limit || 5; // Alapértelmezetten 5 terméket dolgozunk fel
      
      const { data: products, error } = await supabase
        .from('shopify_products')
        .select('id, Title, "Product Type (Custom)", Szőlőfatja, normalized_grape_varieties')
        .or('dryness_level.is.null,dryness_level.eq.')
        .or(`"Product Type (Custom)".ilike.%bor%,"Product Type (Custom)".ilike.%pezsgő%,"Product Type (Custom)".ilike.%champagne%,"Product Type (Custom)".ilike.%wine%`)
        .limit(queryLimit);
      
      if (error) {
        throw error;
      }
      
      if (products.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No products to update' }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      
      // Feldolgozzuk a termékeket egymás után
      const results = [];
      for (const product of products) {
        try {
          // Szőlőfajta kiválasztása
          const grapeVariety = product.normalized_grape_varieties || product.Szőlőfatja || '';
          
          // Szárazsági fok meghatározása
          const drynessLevel = await classifyWineDryness(product.Title, grapeVariety);
          
          // Termék frissítése
          await updateProductDryness(supabase, product.id, drynessLevel);
          
          results.push({
            productId: product.id,
            title: product.Title,
            drynessLevel,
            success: true
          });
        } catch (error) {
          console.error(`Error processing product ${product.id}:`, error);
          results.push({
            productId: product.id,
            title: product.Title,
            error: error.message,
            success: false
          });
        }
      }
      
      return new Response(
        JSON.stringify({ results }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}); 