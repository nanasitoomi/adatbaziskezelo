from flask import Flask, render_template, jsonify, request
import sqlite3
import os
import datetime

app = Flask(__name__)

# Adatbázis kapcsolat létrehozása
def get_db_connection():
    conn = sqlite3.connect('heinemann_products.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/products')
def products():
    conn = get_db_connection()

    # Keresési paraméterek feldolgozása
    search = request.args.get('search', '')
    product_type = request.args.get('product_type', '')
    brand = request.args.get('brand', '')
    origin = request.args.get('origin', '')

    # Alap lekérdezés
    query = 'SELECT * FROM products WHERE 1=1'
    params = []

    # Keresési feltételek hozzáadása
    if search:
        query += ' AND (title LIKE ? OR sku LIKE ? OR description LIKE ?)'
        search_param = f'%{search}%'
        params.extend([search_param, search_param, search_param])

    if product_type:
        query += ' AND product_type LIKE ?'
        params.append(f'%{product_type}%')

    if brand:
        query += ' AND brand LIKE ?'
        params.append(f'%{brand}%')

    if origin:
        query += ' AND origin LIKE ?'
        params.append(f'%{origin}%')

    # Termékek lekérdezése
    products_data = conn.execute(query, params).fetchall()

    # Szűrési opciók lekérdezése
    product_types = conn.execute('SELECT DISTINCT product_type FROM products WHERE product_type IS NOT NULL AND product_type != "" ORDER BY product_type').fetchall()
    brands = conn.execute('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand').fetchall()
    origins = conn.execute('SELECT DISTINCT origin FROM products WHERE origin IS NOT NULL AND origin != "" ORDER BY origin').fetchall()

    conn.close()

    return render_template('products.html',
                           products=products_data,
                           product_types=product_types,
                           brands=brands,
                           origins=origins,
                           search=search,
                           selected_product_type=product_type,
                           selected_brand=brand,
                           selected_origin=origin)

@app.route('/product/<product_id>')
def product_detail(product_id):
    conn = get_db_connection()

    # Shopify termék adatainak lekérdezése
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()

    if product:
        # Kapcsolódó Business Central termék keresése
        bc_product = None
        if product['sku']:
            bc_product = conn.execute('SELECT * FROM business_central_products WHERE bc_item_no = ?',
                                     (product['sku'],)).fetchone()

    conn.close()

    return render_template('product_detail.html',
                           product=product,
                           bc_product=bc_product)

@app.route('/compare')
def compare():
    conn = get_db_connection()

    # Adatok lekérdezése az adatbázisból
    total_shopify = conn.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    total_bc = conn.execute('SELECT COUNT(*) FROM business_central_products').fetchone()[0]

    # Shopify termékek lekérdezése
    shopify_products = conn.execute('SELECT * FROM products').fetchall()

    # Business Central termékek lekérdezése
    bc_products = conn.execute('SELECT * FROM business_central_products').fetchall()

    # Párosított termékek létrehozása
    matched_products = []
    for sp in shopify_products:
        for bc in bc_products:
            if sp['sku'] == bc['bc_item_no']:
                matched_products.append({
                    'shopify': sp,
                    'bc': bc
                })
                break

    matched_count = len(matched_products)

    # Szűrési opciók lekérdezése
    product_types = conn.execute('SELECT DISTINCT product_type FROM products WHERE product_type IS NOT NULL AND product_type != "" ORDER BY product_type').fetchall()
    brands = conn.execute('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand').fetchall()
    origins = conn.execute('SELECT DISTINCT origin FROM products WHERE origin IS NOT NULL AND origin != "" ORDER BY origin').fetchall()

    conn.close()

    return render_template('compare_fullwidth.html',
                           total_shopify=total_shopify,
                           total_bc=total_bc,
                           matched_count=matched_count,
                           matched_products=matched_products,
                           product_types=product_types,
                           brands=brands,
                           origins=origins,
                           current_date=datetime.datetime.now().strftime('%Y.%m.%d'))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)