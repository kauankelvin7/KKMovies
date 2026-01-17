# 🚀 Deploy Completo na Vercel (100% Gratuito)

## ✅ Configuração Completa

Seu projeto está **100% configurado** para rodar gratuitamente e **permanentemente** na Vercel!

---

## 📋 Passo a Passo do Deploy

### 1️⃣ **Preparação**
```bash
# Instale a Vercel CLI (opcional, mas recomendado)
npm install -g vercel
```

### 2️⃣ **Deploy do Backend**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Click em **"Add New Project"**
4. Selecione seu repositório (ou importe do GitHub)
5. **Configure assim:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** deixe vazio
   
6. **Variáveis de Ambiente (Environment Variables):**
   - `NODE_ENV` = `production`
   - `TMDB_API_KEY` = `sua_chave_tmdb` (ou deixe vazio para usar freekeys)
   - `TMDB_BASE_URL` = `https://api.themoviedb.org/3`

7. Click em **Deploy**
8. **Copie a URL do backend** (exemplo: `https://seu-backend.vercel.app`)

---

### 3️⃣ **Deploy do Frontend**

1. Na Vercel, click em **"Add New Project"** novamente
2. Selecione o **mesmo repositório**
3. **Configure assim:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   
4. **Variáveis de Ambiente:**
   - `VITE_API_URL` = `https://seu-backend.vercel.app` (cole a URL do backend do passo 2)

5. Click em **Deploy**
6. Pronto! ✅

---

## 🎯 URLs Finais

Após o deploy você terá:
- **Frontend:** `https://seu-frontend.vercel.app`
- **Backend API:** `https://seu-backend.vercel.app`

---

## ⚙️ Deploy via CLI (Alternativa)

### Backend:
```bash
cd backend
vercel
# Siga as instruções
# Adicione as variáveis de ambiente quando solicitado
```

### Frontend:
```bash
cd frontend
vercel
# Adicione VITE_API_URL com a URL do backend
```

---

## 🔧 Configuração Automática de Domínios

Se quiser conectar os dois projetos:

1. No projeto do **frontend**, vá em **Settings → Environment Variables**
2. Edite `VITE_API_URL` e coloque a URL exata do backend
3. Faça um **Redeploy** do frontend

---

## 📊 Limitações do Plano Gratuito

✅ **Ilimitado permanentemente:**
- Hospedagem
- Banda (100GB/mês - muito alto)
- Builds
- SSL/HTTPS
- CDN Global

⚠️ **Limitações técnicas:**
- **Timeout:** 10 segundos por request (suficiente para 99% dos casos)
- **Serverless:** Backend reinicia a cada request (mas é instantâneo)
- **100 requests/minuto** por IP (rate limit configurado)

---

## 🆘 Troubleshooting

### Erro de CORS:
- Verifique se a URL do backend está correta no frontend
- O CORS já está configurado para aceitar qualquer origem

### API não responde:
- Verifique se as variáveis de ambiente estão configuradas
- Veja os logs na dashboard da Vercel

### Build falha:
- Certifique-se de que as dependências estão instaladas
- Verifique os logs de build na Vercel

---

## 🎉 Vantagens desta Configuração

✅ **100% Gratuito** - Para sempre
✅ **SSL Automático** - HTTPS incluído
✅ **CDN Global** - Site rápido no mundo todo
✅ **Auto-Deploy** - Push no GitHub = deploy automático
✅ **Zero Downtime** - Nunca fica offline
✅ **Escalável** - Aguenta muito tráfego

---

## 📝 Notas Importantes

1. **Sem limitação de tempo** - Diferente do que você pensou, é gratuito PARA SEMPRE
2. **Backend Serverless** - Funciona perfeitamente para APIs REST
3. **Chave TMDb** - Se não configurar, usa o freekeys automaticamente
4. **Monitoramento** - Veja logs e analytics na dashboard Vercel

---

## 🚀 Próximos Passos

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy! 🎉

**Tempo estimado:** 5-10 minutos para configurar tudo!
