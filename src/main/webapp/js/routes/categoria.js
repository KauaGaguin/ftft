// categoria.js (BACKEND - Módulo de Roteamento)

const express = require('express');
const router = express.Router();
const pool = require('./db'); // ⚠️ ATENÇÃO: Verifique se o caminho para o seu arquivo de conexão (db.js) está correto!

/**
 * Rota GET /api/categorias
 * Objetivo: Listar todas as categorias únicas de produtos no banco de dados.
 * (Resolve o erro 404 e o erro de JSON, pois agora a rota existe e retorna JSON)
 */
router.get('/', async (req, res, next) => {
    try {
        // Query para selecionar todos os valores únicos na coluna 'categoria' da tabela 'produtos'.
        // Alias 'nome' é usado para que o frontend possa acessar o campo como 'c.nome'.
        const [categorias] = await pool.query(`
            SELECT DISTINCT categoria as nome 
            FROM produtos 
            ORDER BY categoria
        `);

        // Retorna a lista de categorias como um array JSON.
        // Exemplo de retorno: [{ nome: 'Feminino' }, { nome: 'Masculino' }]
        res.status(200).json(categorias);

    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        // Em caso de erro, retorna um status 500
        res.status(500).json({ status: 'erro', message: 'Erro interno ao buscar categorias.' });
    }
});

module.exports = router;