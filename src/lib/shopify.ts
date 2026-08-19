export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: object;
}): Promise<{ status: number; body: T }> {
  const domain =
    import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN ||
    process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const token =
    import.meta.env?.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  console.log("SHOPIFY CREDS:", { domain, token });

  if (!domain || !token) {
    console.error("Missing Shopify credentials. Please check .env");
    throw new Error("Shopify credentials are not configured");
  }

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
    });

    const body = await result.json();

    if (body.errors) {
      console.error("Shopify GraphQL Errors:", body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    console.error("Error fetching from Shopify:", error);
    throw error;
  }
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: {
      node: {
        url: string;
        altText: string | null;
      };
    }[];
  };
}

const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!) {
    products(first: 5, query: $query) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export async function searchShopifyProducts(
  searchTerm: string
): Promise<ShopifyProduct[]> {
  try {
    // If the search term is empty, we fetch the first 5 products
    const query = searchTerm ? `${searchTerm}` : "";
    
    const response = await shopifyFetch<{
      data: {
        products: {
          edges: { node: ShopifyProduct }[];
        };
      };
    }>({
      query: SEARCH_PRODUCTS_QUERY,
      variables: { query },
    });

    return response.body.data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Failed to search products:", error);
    return [];
  }
}
