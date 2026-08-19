const domain = 'sknpop.in';
const token = '7447fe39496600812389efe71605064b';
const endpoint = `https://${domain}/api/2024-01/graphql.json`;

fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
  },
  body: JSON.stringify({
    query: `
      query searchProducts($query: String!) {
        products(first: 5, query: $query) {
          edges {
            node {
              title
            }
          }
        }
      }
    `,
    variables: { query: "skincare" }
  })
}).then(r => r.json()).then(r => console.log(JSON.stringify(r.data, null, 2))).catch(console.error);
