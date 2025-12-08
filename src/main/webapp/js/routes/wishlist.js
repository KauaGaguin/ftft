const pool = require('./db');
const db = pool;

// 1. ADICIONAR ITEM
exports.adicionarItem = async (req, res) => {
    const { usuarioId, produtoId } = req.body;
    
    if (!usuarioId || !produtoId) {
        return res.status(400).json({ message: 'IDs obrigatórios.' });
    }

    try {
        // Verifica se já existe para evitar duplicidade (embora o banco tenha UNIQUE KEY)
        const [existe] = await db.query('SELECT id FROM wishlist WHERE usuario_id = ? AND produto_id = ?', [usuarioId, produtoId]);
        
        if (existe.length > 0) {
            return res.status(200).json({ message: 'Este produto já está na sua lista.' });
        }

        await db.query('INSERT INTO wishlist (usuario_id, produto_id) VALUES (?, ?)', [usuarioId, produtoId]);
        res.status(201).json({ message: 'Produto adicionado à lista de desejos!' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao salvar na wishlist.' });
    }
};

// 2. REMOVER ITEM
exports.removerItem = async (req, res) => {
    const { usuarioId, produtoId } = req.params;
    try {
        await db.query('DELETE FROM wishlist WHERE usuario_id = ? AND produto_id = ?', [usuarioId, produtoId]);
        res.json({ message: 'Item removido.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao remover item.' });
    }
};

// 3. LISTAR ITENS (Com detalhes do produto)
exports.listarItens = async (req, res) => {
    try {
        // Faz o JOIN com a tabela de produtos para pegar nome, preço e imagem atuais
        const sql = `
            SELECT 
                p.id, 
                p.nome, 
                p.preco, 
                p.caminho_imagem AS img,
                w.data_adicionado
            FROM wishlist w
            JOIN produtos p ON w.produto_id = p.id
            WHERE w.usuario_id = ?
            ORDER BY w.data_adicionado DESC
        `;
        
        const [rows] = await db.query(sql, [req.params.usuarioId]);
        res.json(rows);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao carregar wishlist.' });
    }
};

// 4. (Opcional) MONITORAMENTO PARA PROMOÇÕES
// Esta função seria chamada por um CRON job ou pelo painel do ADM para verificar ofertas
exports.verificarPromocoes = async (req, res) => {
    try {
        console.log("[Wishlist] Verificando promoções para itens salvos...");
        // Aqui entraria a lógica de comparar preço atual < preço antigo
        res.json({ message: 'Monitoramento executado (Simulado).' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};