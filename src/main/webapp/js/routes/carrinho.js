const express = require('express');
const router = express.Router();
const db = require('./db'); // Importa a conexão do banco

// 1. LISTAR Itens do Carrinho
router.get('/:usuarioId', async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.produto_id, c.quantidade, 
                   p.nome, p.preco, p.caminho_imagem, p.descricao 
            FROM carrinho c
            JOIN produtos p ON c.produto_id = p.id
            WHERE c.usuario_id = ?
        `;
        const [rows] = await db.query(query, [req.params.usuarioId]);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar carrinho:", error);
        res.status(500).json({ message: "Erro ao carregar carrinho." });
    }
});

// 2. ADICIONAR Item ao Carrinho
router.post('/', async (req, res) => {
    const { usuario_id, produto_id, quantidade } = req.body;
    
    if (!usuario_id || !produto_id) {
        return res.status(400).json({ message: "Dados incompletos." });
    }

    try {
        // Verifica se o produto já está no carrinho desse usuário
        const [existe] = await db.query(
            'SELECT id, quantidade FROM carrinho WHERE usuario_id = ? AND produto_id = ?', 
            [usuario_id, produto_id]
        );

        if (existe.length > 0) {
            // Se já existe, apenas aumenta a quantidade
            const novaQtd = existe[0].quantidade + (quantidade || 1);
            await db.query('UPDATE carrinho SET quantidade = ? WHERE id = ?', [novaQtd, existe[0].id]);
        } else {
            // Se não existe, cria um novo registro
            await db.query(
                'INSERT INTO carrinho (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)', 
                [usuario_id, produto_id, quantidade || 1]
            );
        }
        res.json({ message: "Produto adicionado ao carrinho!" });
    } catch (error) {
        console.error("Erro ao adicionar:", error);
        res.status(500).json({ message: "Erro interno." });
    }
});

// 3. REMOVER Item do Carrinho
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM carrinho WHERE id = ?', [req.params.id]);
        res.json({ message: "Item removido." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao remover item." });
    }
});

// 4. LIMPAR Carrinho (Após compra)
router.delete('/limpar/:usuarioId', async (req, res) => {
    try {
        await db.query('DELETE FROM carrinho WHERE usuario_id = ?', [req.params.usuarioId]);
        res.json({ message: "Carrinho limpo." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao limpar carrinho." });
    }
});

module.exports = router;