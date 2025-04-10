# Shopify Adatbáziskezelő Webfelület

Termékadatbázis kezelő rendszer a Shopify és Business Central adatok összehasonlítására és harmonizálására.

## A rendszer főbb részei

- **Termékadatok megjelenítése**: Shopify és Business Central termékadatok kezelése
- **Összehasonlító felület**: A két rendszer adatainak áttekinthető összevetése
- **Visszajelzési rendszer**: Termékek értékelése, hibák jelzése, megjegyzések kezelése

## Főbb funkciók

1. **Termékek böngészése és szűrése**
   - Keresési lehetőségek különböző paraméterek alapján 
   - Kártyás és lista nézet
   - Részletes termékadatok

2. **Adatok összehasonlítása**
   - Shopify és Business Central adatok egymás melletti megjelenítése
   - Hiányzó adatok kiemelése
   - Statisztikák az adatok teljességéről

3. **Visszajelzés rendszer**
   - Termékek jóváhagyása vagy hibásnak jelölése
   - Megjegyzések rögzítése a termékekhez
   - Összesített visszajelzés nézet
   - Exportálási lehetőség

## Telepítési útmutató

1. Klónozd a repository-t
2. Telepítsd a szükséges függőségeket
   ```
   pip install -r requirements.txt
   ```
3. Indítsd el a szervert
   ```
   python app.py
   ```

## Firebase migráció

A rendszer jelenleg localStorage-t használ a visszajelzések tárolására, amely webszerverekre költöztetés esetén nem elegendő. Az alábbiakban található a Firebase-re történő migrációs útmutató.

### 1. Firebase projekt létrehozása

1. Regisztrálj a [Firebase Console](https://console.firebase.google.com/)-ba
2. Hozz létre egy új projektet
3. Engedélyezd a Firestore adatbázist
4. Megfelelő biztonsági szabályok beállítása

### 2. Firebase SDK integrálása

Módosítsd az `index.html` fájlt a Firebase SDK betöltéséhez:

```html
<!-- Firebase SDK betöltése (index.html) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>
```

### 3. localStorage funkciók átírása Firebase Firestore-ra

**main.js fájlban a következő funkciókat kell átírni**:

#### 3.1. Firebase inicializálása

```javascript
// Firebase konfigurációja
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase inicializálása
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

#### 3.2. saveFeedback - localStorage helyett Firestore-ba mentés

```javascript
// Feedback mentése Firebase Firestore-ba
async function saveFeedback(productId) {
    const checkbox = document.getElementById(`approve-${productId}`);
    const textarea = document.getElementById(`comment-${productId}`);
    
    if (!checkbox || !textarea) return;
    
    const feedbackData = {
        approved: checkbox.checked,
        comment: textarea.value.trim(),
        timestamp: new Date().toISOString(),
        productId: productId
    };
    
    try {
        // A dokumentum ID-ként a termék ID-t használjuk, így könnyen frissíthető
        await db.collection("product_feedback").doc(productId).set(feedbackData);
        
        // Vizuális visszajelzés
        const saveButton = document.querySelector(`.save-feedback[data-product-id="${productId}"]`);
        if (saveButton) {
            saveButton.innerHTML = '<i class="bi bi-check"></i> Mentve';
            saveButton.classList.remove('btn-primary');
            saveButton.classList.add('btn-success');
            
            // 2 másodperc után visszaállítjuk
            setTimeout(() => {
                saveButton.innerHTML = '<i class="bi bi-save"></i> Mentés';
                saveButton.classList.remove('btn-success');
                saveButton.classList.add('btn-primary');
            }, 2000);
        }
    } catch (error) {
        console.error("Hiba a visszajelzés mentése közben:", error);
        alert("Hiba történt a mentés során. Kérjük, próbálja újra később.");
    }
}
```

#### 3.3 createProductCard - Meglévő visszajelzések betöltése Firestore-ból

```javascript
// A createProductCard függvényben a visszajelzés adatok betöltése
async function createProductCard(product) {
    // ... meglévő kód ...
    
    // Get saved feedback from Firestore
    let feedbackData = { approved: false, comment: '' };
    const productHandle = safeGet(product, 'Product Handle');
    
    try {
        const doc = await db.collection("product_feedback").doc(productHandle).get();
        if (doc.exists) {
            feedbackData = doc.data();
        }
    } catch (error) {
        console.error("Hiba a visszajelzés betöltése közben:", error);
    }
    
    // ... HTML generálás a feedbackData alapján ...
}
```

#### 3.4. showFeedbackSummary - Összesített visszajelzések lekérése Firestore-ból

```javascript
// Visszajelzések összesítése Firebase-ből
async function showFeedbackSummary() {
    try {
        // Összes visszajelzés lekérése
        const snapshot = await db.collection("product_feedback").get();
        const allFeedback = [];
        const productIdsWithFeedback = new Set();
        
        snapshot.forEach(doc => {
            const feedbackData = doc.data();
            // Csak azokat jelenítjük meg, ahol van visszajelzés
            if (feedbackData.approved || feedbackData.comment) {
                allFeedback.push(feedbackData);
                if (feedbackData.productId) {
                    productIdsWithFeedback.add(feedbackData.productId);
                }
            }
        });
        
        // Időrendi sorrendbe rendezzük
        allFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // ... A további kód ugyanaz, csak a localStorage helyett Firestore adatokkal ...
    } catch (error) {
        console.error("Hiba a visszajelzések lekérése közben:", error);
        appContent.innerHTML = `
            <div class="alert alert-danger">
                <h4>Hiba történt a visszajelzések betöltése közben</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary mt-3" id="back-to-products">
                    <i class="bi bi-arrow-left"></i> Vissza a termékekhez
                </button>
            </div>
        `;
        document.getElementById('back-to-products').addEventListener('click', loadProductsView);
    }
}
```

#### 3.5. clearAllFeedback - Összes visszajelzés törlése Firestore-ból

```javascript
// Összes visszajelzés törlése Firebase-ből
async function clearAllFeedback() {
    try {
        const snapshot = await db.collection("product_feedback").get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        return snapshot.size; // Törölt elemek száma
    } catch (error) {
        console.error("Hiba a visszajelzések törlése közben:", error);
        alert("Hiba történt a törlés során. Kérjük, próbálja újra később.");
        return 0;
    }
}
```

### 4. Firebase Hosting beállítása

1. **Firebase CLI telepítése**:
```bash
npm install -g firebase-tools
```

2. **Belépés és inicializálás**:
```bash
firebase login
firebase init
```

3. **Projekt kiválasztása** a beállítás során:
- Válaszd ki a korábban létrehozott Firebase projektet
- Válaszd a Hosting és Firestore opciókat
- Állítsd be a `public` könyvtárat
- Konfiguráld úgy, hogy egyoldalas alkalmazásként működjön

4. **Fájlok előkészítése**: 
- Ellenőrizd, hogy a `supabase_frontend` mappád tartalma a `public` mappába kerüljön
- Helyezd át a következő fájlokat:
  - `index.html`
  - `css/` mappa minden tartalma
  - `js/` mappa minden tartalma

5. **Deploy**:
```bash
firebase deploy
```

### 5. Teljesítmény és biztonság

1. **Firestore indexek**: Nagy adatmennyiségnél szükség lehet indexek létrehozására
2. **Firestore biztonsági szabályok**: Állíts be megfelelő szabályokat, hogy csak engedélyezett felhasználók férhessenek hozzá az adatokhoz
3. **Firebase Authentication**: Ha szükséges a felhasználókezelés, konfiguráld

### 6. Tesztelés

1. Ellenőrizd a visszajelzés működését minden termékre
2. Teszteld az adatok mentését és betöltését
3. Ellenőrizd az összesítő nézetet
4. Teszteld az exportálási funkciókat
5. Ellenőrizd a mobilnézetet is

### 7. Monitoring

Állítsd be a Firebase Analytics és Monitoring eszközöket a teljesítmény és használat követésére.

## Technológiák

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Ikon rendszer**: Bootstrap Icons
- **Adatkezelés**: Supabase (majd Firebase Firestore)
- **SVG ikonok**: Shopify márka elemek

## Támogatás és hibajelentés

Kérdések és problémák esetén vedd fel a kapcsolatot: [fejlesztői e-mail] 