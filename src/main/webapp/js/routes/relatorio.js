const pool = require('./db');
const db = pool;

/**
 * GET /api/relatorios/estoque
 * Retorna a lista completa de movimentações de estoque.
 */
exports.gerarRelatorioEstoque = async (req, res) => {
    try {
        const sql = `
            SELECT 
                m.id, 
                m.data_hora AS data_movimentacao, 
                m.tipo, 
                m.origem, 
                m.quantidade,
                p.nome AS nome_produto,
                IFNULL(u.nome, 'Sistema') AS nome_usuario
            FROM movimentacoes_estoque m
            LEFT JOIN produtos p ON m.produto_id = p.id
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            ORDER BY m.data_hora DESC
            LIMIT 100; -- Limita para não travar se tiver muitos dados
        `;
        
        const [relatorio] = await db.query(sql);
        res.json(relatorio);

    } catch (error) {
        console.error('Erro relatório estoque:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório.' });
    }
};

/**
 * GET /api/relatorios/vendas
 * Query Params: data_inicio, data_fim
 */
exports.gerarRelatorioVendas = async (req, res) => {
     const { data_inicio, data_fim } = req.query;

     if (!data_inicio || !data_fim) {
         return res.status(400).json({ message: 'Datas são obrigatórias.' });
     }

     try {
        // Ajusta a data fim para pegar o dia inteiro (até 23:59:59)
        const fim = new Date(data_fim);
        fim.setDate(fim.getDate() + 1);
        
        const sql = `
            SELECT 
                p.id, 
                p.data_pedido, 
                p.status, 
                p.valor_total,
                IFNULL(u.nome, 'Cliente Removido') AS nome_cliente
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.data_pedido >= ? AND p.data_pedido < ?
            AND p.status != 'cancelado' -- Ignora cancelados no faturamento
            ORDER BY p.data_pedido DESC;
        `;
        
        const [vendas] = await db.query(sql, [data_inicio, fim]);
        res.json(vendas);

    } catch (error) {
        console.error('Erro relatório vendas:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório de vendas.' });
    }
};