# 🚀 Quick Start Guide - KKMovies

## Configuração Rápida em 5 Minutos

### 1️⃣ Obter Chave da API TMDB

1. Acesse [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Crie uma conta gratuita
3. Vá em Settings > API
4. Solicite uma API Key (gratuita)
5. Copie sua **API Key (v3 auth)**

### 2️⃣ Configurar Backend

```powershell
# Navegar para o diretório backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de exemplo
copy .env.example .env

# Editar .env e adicionar sua chave
# Abra o arquivo .env e substitua:
# TMDB_API_KEY=sua_chave_aqui
```

**Arquivo .env deve conter:**
```env
PORT=3001
TMDB_API_KEY=SUA_CHAVE_TMDB_AQUI
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
```

**Iniciar o backend:**
```powershell
npm run dev
```

✅ Backend rodando em: `http://localhost:3001`

### 3️⃣ Configurar Frontend

**Em outro terminal:**

```powershell
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm run dev
```

✅ Frontend rodando em: `http://localhost:3000`

### 4️⃣ Testar a Aplicação

1. Abra o navegador em `http://localhost:3000`
2. Você deve ver a página inicial com filmes em destaque
3. Teste a busca, navegação por categorias e detalhes dos filmes

## 🔧 Comandos Úteis

### Backend
```powershell
npm run dev      # Desenvolvimento com hot reload
npm run build    # Build para produção
npm start        # Executar versão de produção
```

### Frontend
```powershell
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## ⚠️ Troubleshooting

### Erro: "TMDB_API_KEY is not set"
- Verifique se o arquivo `.env` existe no diretório `backend`
- Verifique se a chave foi copiada corretamente

### Erro: "Failed to fetch movies"
- Verifique se o backend está rodando
- Verifique se a porta 3001 não está em uso
- Verifique a conexão com internet

### Erro: "Network Error" no frontend
- Verifique se o backend está rodando
- Verifique se a URL da API está correta no arquivo `.env` do frontend

## 📦 Estrutura de Pastas Criadas

```
KKMovies/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── types/
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── hooks/
    │   ├── types/
    │   └── utils/
    └── package.json
```

## 🎯 Próximos Passos

Após configurar o sistema, você pode:

1. ✅ Explorar os filmes em diferentes categorias
2. ✅ Usar a busca para encontrar filmes específicos
3. ✅ Ver detalhes completos de cada filme
4. ✅ Navegar por filmes similares e recomendações
5. 📝 Começar a personalizar o código para suas necessidades

## 📚 Recursos Adicionais

- **Documentação Completa**: Veja `DOCUMENTATION.md`
- **API TMDB**: [https://developers.themoviedb.org/3](https://developers.themoviedb.org/3)
- **React Docs**: [https://react.dev](https://react.dev)
- **Tailwind CSS**: [https://tailwindcss.com](https://tailwindcss.com)

---

**Pronto! Seu sistema de streaming de filmes está funcionando! 🎉**
