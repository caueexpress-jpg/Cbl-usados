import { getStore } from "@netlify/blobs";

const store = getStore({
  name: "cbl-catalog",
  consistency: "strong"
});

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });

async function allProducts() {
  const { blobs } = await store.list();

  const items = await Promise.all(
    blobs.map(async blob =>
      store.get(blob.key, { type: "json" })
    )
  );

  return items
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export default async (request) => {
  if (request.method === "GET") {
    try {
      return json({ products: await allProducts() });
    } catch (error) {
      return json({ error: "Erro ao carregar catálogo." }, 500);
    }
  }

  if (request.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    const body = await request.json();
    const expected = Netlify.env.get("CBL_ADMIN_PASSWORD");

    if (!expected) {
      return json({
        error: "Configure CBL_ADMIN_PASSWORD nas variáveis de ambiente do Netlify."
      }, 500);
    }

    if (body.action !== "login" && body.password !== expected) {
      return json({ error: "Senha incorreta." }, 401);
    }

    if (body.action === "login") {
      if (body.password !== expected) {
        return json({ error: "Senha incorreta." }, 401);
      }

      return json({ ok: true });
    }

    if (body.action === "list") {
      return json({ products: await allProducts() });
    }

    if (body.action === "save") {
      const p = body.product || {};

      if (!p.id || !p.name) {
        return json({
          error: "Nome e identificador são obrigatórios."
        }, 400);
      }

      await store.setJSON(String(p.id), {
        ...p,
        updatedAt: Date.now()
      });

      return json({ ok: true });
    }

    if (body.action === "delete") {
      if (!body.id) {
        return json({ error: "Identificador ausente." }, 400);
      }

      await store.delete(String(body.id));

      return json({ ok: true });
    }

    if (body.action === "import") {
      if (!Array.isArray(body.products)) {
        return json({ error: "Lista de produtos inválida." }, 400);
      }

      for (const p of body.products) {
        if (p && p.id && p.name) {
          await store.setJSON(String(p.id), {
            ...p,
            updatedAt: Date.now()
          });
        }
      }

      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);

  } catch (error) {
    return json({
      error: "Erro interno ao atualizar o catálogo."
    }, 500);
  }
};
