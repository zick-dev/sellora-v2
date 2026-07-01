import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sellora-v2-production.up.railway.app';

async function getStoreAndProduct(storeSlug: string, productSlug: string) {
  try {
    const storeRes = await fetch(`${API_URL}/api/store/slug/${storeSlug}`, { next: { revalidate: 60 } });
    if (!storeRes.ok) return null;
    const store = await storeRes.json();

    const productRes = await fetch(`${API_URL}/api/products/public/${store.id}/slug/${productSlug}`, { next: { revalidate: 60 } });
    if (!productRes.ok) return null;
    const product = await productRes.json();

    return { store, product };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string; productSlug: string } }): Promise<Metadata> {
  const data = await getStoreAndProduct(params.slug, params.productSlug);
  if (!data) return { title: 'Product Not Found | Kormerce' };

  const { store, product } = data;
  const title = `${product.name} | ${store.store_name}`;
  const description = product.description || `Check out ${product.name} at ${store.store_name}. Shop now on Kormerce.`;
  const image = product.image_url || store.logo_url || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string; productSlug: string } }) {
  return <ProductPageClient storeSlug={params.slug} productSlug={params.productSlug} />;
}
