// ==========================================================
// ARQUIVO: routes/pedido.js (AJUSTADO)
// VERSÃO: Removida a função 'criarPedido' duplicada (a criação ocorre via carrinho/finalizar-compra)
// ==========================================================

// 1. IMPORTAÇÕES E INICIALIZAÇÃO CRÍTICA DO ROUTER
const express = require('express');
const router = express.Router(); 
const pool = require('./db'); // Assumindo que './db' contém a conexão/pool
const db = pool; // Alias para simplificar (pool.query)


// ==========================================================
// FUNÇÕES DE LÓGICA (Definidas para uso nas rotas)
// ==========================================================

// 5. FUNÇÃO: LISTAR PEDIDOS POR USUÁRIO (NOVA ROTA PARA O FRONT-END DO USUÁRIO)
// Lista todos os pedidos do usuário logado.
const listarPorUsuario = async (req, res) => {
 try {
 const { usuario_id } = req.params;
 
 if (!usuario_id) {
  return res.status(400).json({ status: 'erro', mensagem: 'ID do usuário não fornecido.' });
 }

 // Busca pedidos do usuário, ordenados do mais novo para o mais antigo
 const sql = 'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data_pedido DESC';
 const [pedidos] = await db.query(sql, [usuario_id]);

 res.json(pedidos);

 } catch (err) {
 console.error(`Erro ao listar pedidos do usuário ${req.params.usuario_id}:`, err);
 res.status(500).json({ status: 'erro', mensagem: 'Falha ao buscar pedidos do usuário.', detalhes: err.message });
 }
};
const listarPendentes = async (req, res) => {
    try {
        // SQL: Seleciona pedidos onde o status é 'pendente'
        const sql = 'SELECT * FROM pedidos WHERE status = "pendente" ORDER BY data_pedido DESC';
        // Assumindo que 'db' (ou pool.query) está disponível e configurado
        const [pedidos] = await db.query(sql); 

        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao listar pedidos pendentes:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao listar pedidos pendentes.' });
    }
};
const deletarPedido = async (req, res) => {
    const pedidoId = req.params.id;
    const usuarioIdAdmin = req.usuario ? req.usuario.id : null; 
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. OBTÉM ITENS E STATUS (ANTES DE DELETAR)
        const [itensPedido] = await connection.query(
            'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
            [pedidoId]
        );
        
        const [pedidoAtual] = await connection.query('SELECT status FROM pedidos WHERE id = ?', [pedidoId]);
        const statusAnterior = pedidoAtual.length > 0 ? pedidoAtual[0].status : null;

        // 4. EXECUTA A DEVOLUÇÃO NO ESTOQUE (LOOP)
        if (itensPedido.length > 0 && statusAnterior !== 'cancelado' && statusAnterior !== 'recusado') {
             for (const item of itensPedido) {
                await connection.query(
                    'UPDATE estoque SET quantidade = quantidade + ? WHERE produto_id = ?', 
                    [item.quantidade, item.produto_id]
                );
                
                // Registra a movimentação de entrada
                await connection.query(
                    'INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, origem, quantidade) VALUES (?, ?, "entrada", ?, ?)',
                    [item.produto_id, usuarioIdAdmin, `Cancelamento/Exclusão Pedido #${pedidoId}`, item.quantidade]
                );
            }
        }
        
        // 5. DELETA OS ITENS DO PEDIDO (PARTE SOLICITADA)
        // Esta etapa NÃO É NECESSÁRIA se a FOREIGN KEY na tabela itens_pedido 
        // estiver com ON DELETE CASCADE, mas é incluída para controle explícito:
        const sqlItens = 'DELETE FROM itens_pedido WHERE pedido_id = ?';
        await connection.query(sqlItens, [pedidoId]);
        
        // 6. DELETA O PEDIDO
        const sqlPedido = 'DELETE FROM pedidos WHERE id = ?';
        const [result] = await connection.query(sqlPedido, [pedidoId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'erro', mensagem: 'Pedido não encontrado para exclusão.' });
        }
        
        // 7. Finaliza a transação
        await connection.commit(); 

        res.json({ status: 'sucesso', mensagem: `Pedido ${pedidoId} deletado com sucesso. Estoque devolvido.` });

    } catch (error) {
        console.error(`🚨 ERRO AO DELETAR PEDIDO ID ${pedidoId}:`, error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno no servidor ao deletar pedido.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};// ----------------------------------------------------------
// FUNÇÃO: FINALIZAR PEDIDO (PUT /finalizar/:id) - COMPLETA
// Realiza a baixa (dedução) do estoque e finaliza o pedido.
// ----------------------------------------------------------
const finalizar = async (req, res) => {
    const pedidoId = req.params.id;
    const usuarioIdAdmin = req.usuario ? req.usuario.id : null; 
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. Obtém os itens do pedido, status atual E O ID DO CLIENTE
        const [pedidoData] = await connection.query('SELECT status, usuario_id FROM pedidos WHERE id = ?', [pedidoId]);
        
        if (pedidoData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'erro', mensagem: `Pedido ID ${pedidoId} não encontrado.` });
        }
        
        const { status: statusAtual, usuario_id: usuarioIdCliente } = pedidoData[0];
        
        if (statusAtual === 'concluido') {
             await connection.rollback();
             return res.status(409).json({ status: 'erro', mensagem: `Pedido ID ${pedidoId} já está concluído.` });
        }
        
        const [itensPedido] = await connection.query(
            'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
            [pedidoId]
        );

        if (itensPedido.length === 0) {
            await connection.query('UPDATE pedidos SET status = "concluido", data_finalizacao = NOW() WHERE id = ?', [pedidoId]);
            await connection.commit();
            return res.status(200).json({ status: 'sucesso', mensagem: `Pedido ID ${pedidoId} finalizado. Sem itens para baixa de estoque.` });
        }

        // 4. EXECUTA A BAIXA NO ESTOQUE (LOOP)
        for (const item of itensPedido) {
            const [updateEstoqueResult] = await connection.query(
                'UPDATE estoque SET quantidade = quantidade - ? WHERE produto_id = ?', 
                [item.quantidade, item.produto_id]
            );

            if (updateEstoqueResult.affectedRows === 0) {
                 await connection.rollback();
                 return res.status(404).json({ status: 'erro', mensagem: `Produto ID ${item.produto_id} não encontrado na tabela de estoque.` });
            }
            
            // B. Registra a movimentação de saída
            await connection.query(
                'INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, origem, quantidade) VALUES (?, ?, "saida", ?, ?)',
                [item.produto_id, usuarioIdAdmin, `Venda (Pedido #${pedidoId})`, item.quantidade]
            );
        }

        // 5. ATUALIZA O STATUS DO PEDIDO
        const sqlStatus = 'UPDATE pedidos SET status = "concluido", data_finalizacao = NOW() WHERE id = ?';
        await connection.query(sqlStatus, [pedidoId]);
        
        // 6. Finaliza a transação (AQUI GARANTIMOS QUE ESTOQUE E STATUS FORAM ATUALIZADOS)
        await connection.commit(); 
        
        // 7. GERA NOTIFICAÇÃO PARA O CLIENTE (PARTE SOLICITADA)
        // Esta inserção deve vir APÓS o commit para não travar a transação crítica
        if (usuarioIdCliente) {
            const mensagem = `Seu pedido #${pedidoId} foi finalizado pelo administrador e está pronto para entrega.`;
            // Assumindo que a tabela notificacoes está acessível via pool (ou db)
            await db.query(
                'INSERT INTO notificacoes (usuario_id, tipo, mensagem) VALUES (?, ?, ?)',
                [usuarioIdCliente, 'pedido_finalizado', mensagem]
            );
        }

        res.json({ 
            status: 'sucesso', 
            mensagem: `Pedido ${pedidoId} finalizado e estoque baixado com sucesso.`,
            pedidoId: pedidoId 
        });

    } catch (error) {
        console.error(`🚨 ERRO NA FINALIZAÇÃO DO PEDIDO ID ${pedidoId}:`, error);
        if (connection) {
            await connection.rollback();
        }
        if (error.sqlMessage && error.sqlMessage.includes('CHECK constraint') || error.message.includes('Estoque insuficiente')) {
            return res.status(400).json({ status: 'erro', mensagem: 'Estoque insuficiente para finalizar um ou mais itens.' });
        }
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno no servidor ao finalizar pedido.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
router.get('/meus', async (req, res) => {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) return res.status(400).json({ message: 'ID obrigatório.' });

    try {
        const sql = `
            SELECT id, status, valor_total, data_pedido, codigo_rastreio 
            FROM pedidos 
            WHERE usuario_id = ? 
            ORDER BY data_pedido DESC
        `;
        const [pedidos] = await pool.query(sql, [usuarioId]);
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar pedidos.' });
    }
});
// 2. [NOVO] Obter Detalhes de um Pedido (Itens + Endereço)
router.get('/:id', async (req, res) => {
    const pedidoId = req.params.id;

    try {
        // Busca dados gerais do pedido
        const sqlPedido = `
            SELECT id, status, valor_total, valor_frete, valor_desconto, data_pedido, endereco_entrega, codigo_rastreio
            FROM pedidos WHERE id = ?
        `;
        const [pedidoRes] = await pool.query(sqlPedido, [pedidoId]);
        
        if (pedidoRes.length === 0) return res.status(404).json({ message: 'Pedido não encontrado.' });
        const pedido = pedidoRes[0];

        // Busca os itens do pedido
        const sqlItens = `
            SELECT 
                ip.quantidade, 
                ip.preco_unitario,
                p.nome AS nome_produto,
                p.caminho_imagem
            FROM itens_pedido ip
            JOIN produtos p ON ip.produto_id = p.id
            WHERE ip.pedido_id = ?
        `;
        const [itens] = await pool.query(sqlItens, [pedidoId]);

        // Retorna tudo junto
        res.json({ ...pedido, itens });

    } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// Rota para finalizar/atualizar status (usado pelo ADM/Func)
router.put('/finalizar/:id', async (req, res) => {
    try {
        await pool.query("UPDATE pedidos SET status = 'concluido' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Status atualizado.' });
    } catch (e) {
        res.status(500).json({ message: 'Erro ao atualizar.' });
    }
});

router.put('/finalizar/:id', finalizar); 
router.delete('/:id', deletarPedido); 
router.get('/pendentes', listarPendentes);

// ✅ ROTA: Lista todos os pedidos de um usuário específico
router.get('/usuario/:usuario_id', listarPorUsuario); 


// Rota de atualização de status (mantida)
router.put('/status/:id', async (req, res) => {
 const pedidoId = req.params.id;
 const { novoStatus } = req.body; 

 const statusValidos = ['concluido', 'cancelado', 'recusado', 'em_transporte', 'pendente', 'aguardando_pagamento', 'entregue']; 
 if (!novoStatus || !statusValidos.includes(novoStatus)) {
 return res.status(400).json({ status: 'erro', mensagem: 'Status inválido ou não fornecido.' });
 }

 try {
 const sql = 'UPDATE pedidos SET status = ? WHERE id = ?';
 const [result] = await db.query(sql, [novoStatus, pedidoId]); 

 if (result.affectedRows > 0) {
 res.json({ status: 'sucesso', mensagem: `Pedido ${pedidoId} atualizado para ${novoStatus}.` });
 } else {
 res.status(404).json({ status: 'erro', mensagem: 'Pedido não encontrado.' });
 }
 } catch (err) {
 console.error('Erro ao atualizar status do pedido:', err);
 res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao atualizar status.', detalhes: err.message });
 }
});

module.exports = router;