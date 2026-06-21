"""
Seed script for the Kormerce demo storefront.
Uses the real signup/store/product APIs so the data is 100% realistic.
"""
import requests
import sys

BASE_URL = "https://sellora-v2-production.up.railway.app"

DEMO_EMAIL = "demo@kormerce.com"
DEMO_PASSWORD = "DemoStore2026!"
DEMO_NAME = "Amaka Johnson"

STORE_NAME = "Amaka's Closet"
STORE_SLUG = "amakas-closet"
STORE_DESC = "Affordable, trendy fashion for the modern African woman. Ankara, casual wear, and accessories — delivered to your door."

PRODUCTS = [
    {"name": "Ankara Wrap Dress", "price": 15000, "stock": 12, "category": "Dresses",
     "description": "Vibrant Ankara print wrap dress, true to size, perfect for any occasion."},
    {"name": "Denim Jacket", "price": 22000, "stock": 8, "category": "Outerwear",
     "description": "Classic oversized denim jacket, unisex fit, durable and stylish."},
    {"name": "Kente Print Blouse", "price": 9500, "stock": 20, "category": "Tops",
     "description": "Lightweight Kente print blouse, breathable fabric, great for office or casual wear."},
    {"name": "High-Waist Trousers", "price": 12000, "stock": 15, "category": "Bottoms",
     "description": "Tailored high-waist trousers, stretch fabric for all-day comfort."},
    {"name": "Beaded Statement Necklace", "price": 6500, "stock": 25, "category": "Accessories",
     "description": "Handcrafted beaded necklace, adds the perfect pop of color to any outfit."},
    {"name": "Ankara Headwrap", "price": 3500, "stock": 30, "category": "Accessories",
     "description": "Premium Ankara fabric headwrap, pre-tied style options included."},
    {"name": "Casual Sneakers", "price": 18000, "stock": 10, "category": "Footwear",
     "description": "Comfortable everyday sneakers, available in multiple sizes."},
    {"name": "Crossbody Bag", "price": 14500, "stock": 14, "category": "Accessories",
     "description": "Compact crossbody bag with adjustable strap, faux leather finish."},
]

CATEGORIES = ["Dresses", "Outerwear", "Tops", "Bottoms", "Accessories", "Footwear"]


def main():
    s = requests.Session()

    # 1. Signup
    print("Signing up demo account...")
    r = s.post(f"{BASE_URL}/api/auth/signup", json={
        "name": DEMO_NAME,
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
    })
    if r.status_code == 201:
        print("  + Account created")
        token = r.json()["access_token"]
    elif r.status_code == 400 and "already" in r.text.lower():
        print("  - Account already exists, logging in instead...")
        r2 = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
        })
        if r2.status_code != 200:
            print("  ! Login failed:", r2.text)
            sys.exit(1)
        token = r2.json()["access_token"]
    else:
        print("  ! Signup failed:", r.status_code, r.text)
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create store
    print("Creating store...")
    r = s.post(f"{BASE_URL}/api/store/setup", headers=headers, json={
        "store_name": STORE_NAME,
        "slug": STORE_SLUG,
        "description": STORE_DESC,
    })
    if r.status_code == 201:
        print("  + Store created:", r.json()["id"])
        store_id = r.json()["id"]
    elif r.status_code == 400 and "already exists" in r.text.lower():
        print("  - Store already exists, fetching it...")
        r2 = s.get(f"{BASE_URL}/api/store/me", headers=headers)
        store_id = r2.json()["id"]
        print("  + Using existing store:", store_id)
    else:
        print("  ! Store creation failed:", r.status_code, r.text)
        sys.exit(1)

    # 3. Update store branding/settings
    print("Updating store branding...")
    r = s.put(f"{BASE_URL}/api/store/me", headers=headers, json={
        "theme_color": "#4F46E5",
        "base_currency": "NGN",
        "categories": str(CATEGORIES).replace("'", '"'),
        "whatsapp": "2348012345678",
        "instagram": "amakascloset",
        "delivery_fee": 1500,
        "free_delivery_above": 25000,
        "show_trust_bar": True,
        "category_type": "clothing",
    })
    if r.status_code == 200:
        print("  + Store branding updated")
    else:
        print("  ! Branding update failed:", r.status_code, r.text)

    # 4. Add products
    print("Adding products...")
    for p in PRODUCTS:
        r = s.post(f"{BASE_URL}/api/products/store/{store_id}", headers=headers, json={
            "name": p["name"],
            "price": p["price"],
            "stock": p["stock"],
            "category": p["category"],
            "description": p["description"],
        })
        if r.status_code == 201:
            print(f"  + Added: {p['name']}")
        else:
            print(f"  ! Failed to add {p['name']}: {r.status_code} {r.text}")

    print(f"\nDone! Demo store live at: {BASE_URL.replace('sellora-v2-production.up.railway.app', 'sellora-v2-blue.vercel.app')}/store/{STORE_SLUG}")
    print(f"Or locally: http://localhost:3000/store/{STORE_SLUG}")


if __name__ == "__main__":
    main()
