import { getStore } from "@netlify/blobs";

const STORE_NAME = "cbl-catalog";
const CATALOG_KEY = "_catalog_v1";
const MAX_IMAGE_DATA_URL_LENGTH = 3 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function validPassword(password) {
  const expected = process.env.CBL_ADMIN_PASSWORD;
  return Boolean(expected && typeof password === "string" && password === expected);
}

function normalizeProduct(p) {
  return {
    id: String(p.id),
    name: String(p.name || "Produto").slice(0, 120),
    price: String(p.price || "0"),
    category: String(p.category || "Outros").slice(0, 40),
    description: String(p.description || "").slice(0, 500),
    image: p.image,
  };
}

async function readProducts(store) {
  const saved = await store.get(CATALOG_KEY, { type: "json" });
  if (Array.isArray(saved)) return saved;

  const { blobs = [] } = await store.list();
  const products = [];

  for (const blob of blobs) {
    if (blob.key === CATALOG_KEY) continue;

    try {
      const product = await store.get(blob.key, { type: "json" });

      if (
        product &&
        typeof product.id === "string" &&
        typeof product.image === "string"
      ) {
        products.push(normalizeProduct(product));
      }
    } catch (error) {
      console.error("Não foi possível ler o produto legado:", blob.key, error);
    }
  }

  products.sort((a, b) => Number(b.id) - Number(a.id));
  return products;
}

export default async (req) => {
  try {
    const store = getStore({
      name: STORE_NAME,
      consistency: "strong",
    });

    if (req.method === "GET") {
      return json({ products: await readProducts(store) });
    }

    if (req.method !== "POST") {
      return json({ error: "Método não permitido." }, 405);
    }

    const body = await req.json();
    const { action, password } = body || {};

    if (action === "login") {
      return validPassword(password)
        ? json({ ok: true })
        : json({ error: "Senha incorreta." }, 401);
    }

    if (!validPassword(password)) {
      return json({ error: "Senha incorreta." }, 401);
    }

    if (action === "save") {
      const p = body.product;

      if (
        !p ||
        typeof p.id !== "string" ||
        !p.id ||
        typeof p.name !== "string" ||
        !p.name.trim() ||
        !p.price ||
        typeof p.image !== "string"
      ) {
        return json({ error: "Dados do produto incompletos." }, 400);
      }

      if (
        p.image.length > MAX_IMAGE_DATA_URL_LENGTH ||
        !/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(p.image)
      ) {
        return json({
          error: "Imagem inválida ou muito grande. Use uma imagem de até 2 MB.",
        }, 400);
      }

      const products = await readProducts(store);
      const product = normalizeProduct(p);
      const index = products.findIndex((item) => item.id === product.id);

      if (index >= 0) {
        products[index] = product;
      } else {
        products.unshift(product);
      }

      await store.setJSON(CATALOG_KEY, products);

      return json({ ok: true, count: products.length });
    }

    if (action === "delete") {
      if (typeof body.id !== "string" || !body.id) {
        return json({ error: "Produto inválido." }, 400);
      }

      const products = await readProducts(store);
      const updated = products.filter((item) => item.id !== body.id);

      await store.setJSON(CATALOG_KEY, updated);

      return json({ ok: true, count: updated.length });
    }

    if (action === "import") {
      const current = await readProducts(store);

      if (current.length === 0 && Array.isArray(body.products)) {
        const imported = body.products
          .filter(
            (p) =>
              p &&
              typeof p.id === "string" &&
              typeof p.image === "string" &&
              p.image.length <= MAX_IMAGE_DATA_URL_LENGTH
          )
          .slice(0, 100)
          .map(normalizeProduct);

        await store.setJSON(CATALOG_KEY, imported);
      }

      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("Erro no catálogo CBL:", error);

    return json({
      error: "Erro interno ao acessar o catálogo. Consulte os logs da função catalog.",
    }, 500);
  }
};
