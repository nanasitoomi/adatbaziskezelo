const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS engedélyezése
app.use(cors());

// Statikus fájlok kiszolgálása a supabase_frontend mappából
app.use(express.static(path.join(__dirname, 'supabase_frontend')));

// Minden kérés visszaadja az index.html-t (SPA mód)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'supabase_frontend', 'index.html'));
});

// Szerver indítása
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 