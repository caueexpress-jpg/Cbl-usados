CBL USADOS — LOJA CONECTADA AO SUPABASE

ARQUIVOS
- index.html: loja pública
- admin.html: painel administrativo
- config.js: URL e publishable key do Supabase
- assets/: logo e fotos originais fornecidas

ANTES DE PUBLICAR
1) No Supabase, confirme que executou os SQLs de products, admin_users e storage.
2) No SQL de admin_users, a linha insert precisa ter seu UID real.
3) A policy de produtos e storage usa public.is_admin() para restringir alterações.
4) O usuário criado em Authentication > Users deve ser o mesmo UID inserido em admin_users.
5) A loja usa o bucket público product-images.

PUBLICAR NA NETLIFY
1) Extraia o ZIP.
2) Envie o conteúdo da pasta CBL_Usados_Supabase para um novo deploy manual na Netlify (Deploys > Add new deploy > Deploy manually), ou substitua os arquivos do site existente pelo conteúdo desta pasta.
3) Abra https://SEU-SITE.netlify.app/ para a loja.
4) Abra https://SEU-SITE.netlify.app/admin.html para o painel.
5) Entre com o e-mail e a senha do usuário criado no Supabase.

OBSERVAÇÕES
- A publishable key é destinada ao frontend e está em config.js. Nunca adicione service_role ou secret key ao site.
- Admin só funciona para o usuário cujo UID está cadastrado em public.admin_users.
- Produtos em status draft não aparecem na loja; mude para published para publicar.
- Fotos enviadas pelo Admin ficam no Storage product-images.
- O site ainda não tem checkout com pagamento online nem cálculo automático de frete. O botão de interesse abre conversa no WhatsApp.
- Se o site atual já tiver domínio personalizado, mantenha-o no mesmo site Netlify para preservar o endereço.
