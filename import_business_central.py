import pandas as pd
import sqlite3
import os

def import_business_central_data(excel_file='business_central_export.xlsx'):
    """
    Business Central Excel export importálása az adatbázisba
    """
    print(f"Business Central adatok importálása: {excel_file}")

    # Ellenőrizzük, hogy a fájl létezik-e
    if not os.path.exists(excel_file):
        print(f"HIBA: A fájl nem található: {excel_file}")
        return False

    try:
        # Excel fájl beolvasása
        df = pd.read_excel(excel_file)
        print(f"Excel fájl beolvasva, {len(df)} sor található benne.")

        # Oszlopnevek kiíratása
        print("Oszlopok:")
        for col in df.columns:
            print(f"  - {col}")

        # Adatbázis kapcsolat létrehozása
        conn = sqlite3.connect('heinemann_products.db')
        cursor = conn.cursor()

        # Business Central termékek tábla létrehozása
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS business_central_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bc_item_no TEXT,
            bc_description TEXT,
            bc_base_unit_of_measure TEXT,
            bc_unit_price REAL,
            bc_vendor_no TEXT,
            bc_vendor_name TEXT,
            bc_inventory INTEGER,
            bc_item_category_code TEXT,
            bc_product_group_code TEXT,
            bc_brand TEXT,
            bc_country_region_of_origin_code TEXT,
            bc_tariff_no TEXT,
            bc_net_weight REAL,
            bc_gross_weight REAL,
            bc_unit_volume REAL,
            bc_alcohol_by_volume REAL,
            bc_vintage TEXT
        )
        ''')

        # Adatok törlése a táblából, ha már létezik
        cursor.execute('DELETE FROM business_central_products')

        # Adatok konvertálása és beszúrása az adatbázisba
        for index, row in df.iterrows():
            # Az oszlopneveket a DataFrame oszlopnevei alapján állítsd be
            # Itt példaként néhány általános oszlopnevet használok, ezeket módosítsd a tényleges oszlopnevekre
            try:
                # Próbáljuk meg kinyerni az adatokat a DataFrame-ből a tényleges oszlopnevekkel
                item_no = row.get('Szám', '')
                description = row.get('Megnevezés', '')
                base_unit = 'db'  # Alapértelmezett érték
                unit_price = row.get('Egységköltség 1', 0)
                vendor_no = ''  # Nincs ilyen oszlop
                vendor_name = ''  # Nincs ilyen oszlop
                inventory = row.get('Belföldi készlet', 0)
                item_category = row.get('Termékkategória', '')
                product_group = row.get('Termék-alkategória', '')
                brand = ''  # Nincs ilyen oszlop
                country = row.get('Terület', '')
                tariff_no = ''  # Nincs ilyen oszlop
                net_weight = 0  # Nincs ilyen oszlop
                gross_weight = 0  # Nincs ilyen oszlop
                unit_volume = row.get('Kiszerelés', 0)
                alcohol_by_volume = 0  # Nincs ilyen oszlop
                vintage = row.get('Évjárat', '')

                # Adatok beszúrása az adatbázisba
                cursor.execute('''
                INSERT INTO business_central_products (
                    bc_item_no, bc_description, bc_base_unit_of_measure, bc_unit_price,
                    bc_vendor_no, bc_vendor_name, bc_inventory, bc_item_category_code,
                    bc_product_group_code, bc_brand, bc_country_region_of_origin_code,
                    bc_tariff_no, bc_net_weight, bc_gross_weight, bc_unit_volume, bc_alcohol_by_volume,
                    bc_vintage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    item_no, description, base_unit, unit_price,
                    vendor_no, vendor_name, inventory, item_category,
                    product_group, brand, country, tariff_no,
                    net_weight, gross_weight, unit_volume, alcohol_by_volume,
                    vintage
                ))
            except Exception as e:
                print(f"HIBA a {index+1}. sor feldolgozásakor: {e}")
                print(f"Sor adatai: {row}")
                continue

        # Változtatások mentése
        conn.commit()

        # Ellenőrzés: hány rekord került be az adatbázisba
        cursor.execute('SELECT COUNT(*) FROM business_central_products')
        count = cursor.fetchone()[0]
        print(f"Sikeresen importálva {count} termék a Business Central exportból.")

        conn.close()
        return True

    except Exception as e:
        print(f"HIBA az importálás során: {e}")
        return False

if __name__ == "__main__":
    import_business_central_data()
