const pool = require('./db');
const db = pool;

// Verifica se o pool foi carregado
if (!db) {
    console.error("ERRO CRÍTICO: Pool de conexão não encontrado em estoque.js");
}

/**
 * ATUALIZAR ITEM ESTOQUE (PUT /api/estoque/:id)
 * Define o saldo total de um produto (Ajuste Manual / Inventário).
 */
const atualizarItemEstoque = async (req, res) => {
    let connection;
    try {
        const produtoId = req.params.id;
        const { quantidade } = req.body; 
        const funcionarioId = 1; // ID fixo para Admin

        if (quantidade === undefined || isNaN(quantidade) || parseInt(quantidade, 10) < 0) {
            return res.status(400).json({ status: 'erro', mensagem: 'Quantidade de estoque inválida.' });
        }
        
        const novaQuantidade = parseInt(quantidade, 10);
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Obter o saldo atual para calcular a diferença e registrar o tipo correto
        const sqlSaldoAtual = `SELECT IFNULL(quantidade, 0) AS saldo_atual FROM estoque WHERE produto_id = ? FOR UPDATE`;
        const [resultSaldo] = await connection.query(sqlSaldoAtual, [produtoId]);
        const saldoAtual = resultSaldo.length > 0 ? resultSaldo[0].saldo_atual : 0;
        
        const diferenca = novaQuantidade - saldoAtual;
        
        // Se não houver mudança, retorna sucesso sem fazer nada
        if (diferenca === 0) {
            await connection.rollback();
            connection.release();
            return res.json({ status: 'sucesso', mensagem: 'Estoque já estava atualizado.', novoSaldo: novaQuantidade });
        }

        const tipoMovimentacao = diferenca > 0 ? 'entrada' : 'saida';
        const quantidadeMovimentada = Math.abs(diferenca);

        // 2. Atualizar a tabela de saldo (estoque)
        const sqlAtualizaEstoque = `
            INSERT INTO estoque (produto_id, quantidade) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE quantidade = ?;
        `;
        await connection.query(sqlAtualizaEstoque, [produtoId, novaQuantidade, novaQuantidade]);
        
        // 3. Registrar o histórico (movimentacoes_estoque)
        const sqlMovimentacao = `
            INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, origem, data_hora)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const origem = 'Ajuste manual (Correção de Saldo)';
        
        await connection.query(sqlMovimentacao, [
            produtoId,
            funcionarioId, 
            tipoMovimentacao, 
            quantidadeMovimentada,
            origem
        ]);
        
        await connection.commit();
        res.json({ 
            status: 'sucesso', 
            mensagem: `Estoque do produto ID ${produtoId} ajustado com sucesso para ${novaQuantidade}.`,
            novoSaldo: novaQuantidade
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('ERRO NA ROTA PUT /api/estoque/:id:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao ajustar o estoque.', detalhes: err.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * REGISTRAR MOVIMENTAÇÃO (POST /api/estoque)
 * Adiciona ou remove uma quantidade específica (Entrada/Saída).
 * Usado pelo formulário de movimentação no painel.
 */
const registrarMovimentacao = async (req, res) => {
    let connection;
    try {
        // Agora aceitamos 'funcionarioId' vindo do front-end
        const { produto_id, quantidade, origem, funcionarioId } = req.body;
        
        // Se não vier ID, usa 1 (Admin) como fallback, mas o ideal é sempre vir do front
        const idUsuarioFinal = funcionarioId ? parseInt(funcionarioId, 10) : 1;

        if (!produto_id || quantidade === undefined || isNaN(quantidade)) {
            return res.status(400).json({ status: 'erro', mensagem: 'Dados de movimentação inválidos.' });
        }
        
        const quantidadeMovimentada = parseInt(quantidade, 10);
        if (quantidadeMovimentada === 0) {
            return res.status(400).json({ status: 'erro', mensagem: 'Quantidade não pode ser zero.' });
        }

        const tipoMovimentacao = quantidadeMovimentada > 0 ? 'entrada' : 'saida';

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Atualizar o saldo (SOMA o valor, que pode ser negativo)
        const sqlAtualizaEstoque = `
            INSERT INTO estoque (produto_id, quantidade) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE quantidade = IFNULL(quantidade, 0) + ?;
        `;
        await connection.query(sqlAtualizaEstoque, [produto_id, quantidadeMovimentada, quantidadeMovimentada]);

        // 2. Registrar o histórico
        const sqlMovimentacao = `
            INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, origem, data_hora)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        // Define a origem se não vier preenchida
        const origemFinal = origem || (quantidadeMovimentada > 0 ? 'Entrada via Painel Operacional' : 'Saída via Painel Operacional');
        
        await connection.query(sqlMovimentacao, [
            produto_id,
            idUsuarioFinal, // <--- AQUI ESTÁ A CORREÇÃO: Usa o ID do funcionário
            tipoMovimentacao,
            Math.abs(quantidadeMovimentada),
            origemFinal
        ]);

        await connection.commit();

        res.json({ status: 'sucesso', mensagem: 'Movimentação registrada e vinculada ao funcionário.' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('ERRO NA ROTA POST /api/estoque:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao registrar movimentação.', detalhes: err.message });
    } finally {
        if (connection) connection.release();
    }
};


const getHistoricoEstoque = async (req, res) => {
    try {
        const { produtoId } = req.params;
        console.log(`[Histórico] Buscando histórico para Produto ID: ${produtoId}`);

        const sql = `
            SELECT 
                m.id,
                m.data_hora AS data_movimentacao, 
                m.tipo, 
                m.origem, 
                m.quantidade,
                IFNULL(u.nome, 'Sistema') AS nome_usuario
            FROM movimentacoes_estoque m
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.produto_id = ?
            ORDER BY m.data_hora DESC;
        `;
        
        const [historico] = await db.query(sql, [produtoId]);
        
        res.json(historico);

    } catch (error) {
        console.error('Erro ao buscar histórico de estoque:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar histórico de estoque.', detalhes: error.message });
    }
};

// --- Funções Placeholder (Para evitar erros de importação no server.js) ---
const getEstoqueGerencial = async (req, res) => {
    res.status(501).json({ status: 'erro', mensagem: 'Função de Gerencial não implementada.' });
};

const getAlertasEstoque = async (req, res) => {
    res.status(501).json({ status: 'erro', mensagem: 'Função de Alertas não implementada.' });
};

// Exportação correta de todas as funções
module.exports = {
    atualizarItemEstoque,
    registrarMovimentacao,
    getHistoricoEstoque,
    getEstoqueGerencial,
    getAlertasEstoque
};