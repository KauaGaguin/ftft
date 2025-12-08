// produto.router.js

const express = require('express');
const router = express.Router();
const produtoController = require('./produto'); // Importa as funções do produto.js

// Middleware para garantir que o router está sendo usado corretamente
router.use((req, res, next) => {
    console.log(`[PRODUTO ROUTER] Requisição recebida em: ${req.url}`);
    next();
});

// ✅ GET /api/produtos (Lista todos os produtos com filtros)
router.get('/', produtoController.listar);

// ✅ POST /api/produtos (Cria um novo produto)
router.post('/', produtoController.criar);

// ✅ GET /api/produtos/:id (Busca um produto específico por ID)
router.get('/:id', produtoController.buscarPorId);

// ✅ PUT /api/produtos/:id (Atualiza um produto)
router.put('/:id', produtoController.atualizar);

// ✅ DELETE /api/produtos/:id (Remove um produto)
router.delete('/:id', produtoController.remover);

module.exports = router;