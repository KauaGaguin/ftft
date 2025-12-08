// produto.js - Controlador (Controller) do Backend

const pool = require('./db');

// Definição correta do DB
const db = pool;

// Verificação de segurança
if (!pool || typeof pool.execute !== 'function') {
    console.error("ERRO CRÍTICO: O objeto 'pool' do DB não foi carregado corretamente!");
} else {
    // Alias para compatibilidade
    pool.query = pool.execute;
    console.log("SUCESSO: Conexão com o Banco de Dados (produto.js) carregada.");
}

exports.criar = async (req, res, next) => {
    const { 
        nome, descricao, preco, custo_unitario, categoria, linha, caminho_imagem, 
        destaque, exibir_index, exibir_page1, exibir_page2, promocao, 
        estoque_inicial
    } = req.body;
    
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const vDestaque = destaque ? 1 : 0;
        const vExibirIndex = exibir_index ? 1 : 0;
        const vExibirPage1 = exibir_page1 ? 1 : 0;
        const vExibirPage2 = exibir_page2 ? 1 : 0;
        const vPromocao = promocao ? 1 : 0;
        const vCustoUnitario = (custo_unitario && parseFloat(custo_unitario) > 0) ? parseFloat(custo_unitario) : 0.00;

        const sqlProduto = `
            INSERT INTO produtos 
            (nome, descricao, preco, custo_unitario, categoria, linha, caminho_imagem, destaque, exibir_index, exibir_page1, exibir_page2, promocao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [resultProduto] = await connection.query(sqlProduto, [
            nome, descricao, preco, vCustoUnitario,
            categoria, linha, caminho_imagem, 
            vDestaque, vExibirIndex, vExibirPage1, vExibirPage2, vPromocao
        ]);
        const novoProdutoId = resultProduto.insertId;

        const estoque = parseInt(estoque_inicial) || 0; 
        const sqlEstoque = `INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)`;
        await connection.query(sqlEstoque, [novoProdutoId, estoque]); 
        
        await connection.query(
            'INSERT INTO movimentacoes_estoque (produto_id, tipo, origem, quantidade, usuario_id, data_hora) VALUES (?, ?, ?, ?, ?, NOW())',
            [novoProdutoId, 'entrada', 'Cadastro Inicial', estoque, 1]
        );

        await connection.commit();

        res.status(201).json({ 
            status: 'sucesso', 
            mensagem: 'Produto e estoque cadastrados com sucesso!', 
            produtoId: novoProdutoId 
        });

    } catch (error) {
        console.error('Erro ao criar produto:', error);
        if (connection) await connection.rollback();
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao criar produto.', detalhes: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.listar = async (req, res, next) => {
    const isAdmView = req.query.view === 'adm';
    const categoriaFiltro = req.query.categoria; 

    try {
        let sql = '';
        let params = [];

        if (isAdmView) {
            sql = `
                SELECT
                    p.id, p.nome, p.descricao, p.preco, p.custo_unitario, 
                    p.categoria, p.linha, p.caminho_imagem,
                    p.destaque, p.exibir_index, p.exibir_page1, p.exibir_page2, p.promocao,
                    IFNULL(e.quantidade, 0) AS estoque 
                FROM produtos p
                LEFT JOIN estoque e ON p.id = e.produto_id
                ORDER BY p.id DESC
            `;
        } else {
            sql = `
                SELECT 
                    p.id, p.nome, p.preco, p.descricao, p.categoria, p.linha, p.caminho_imagem, 
                    p.destaque, p.promocao, 
                    IFNULL(e.quantidade, 0) AS estoque
                FROM produtos p
                LEFT JOIN estoque e ON p.id = e.produto_id
                WHERE 1=1
            `; 
            if (categoriaFiltro) {
                sql += ' AND p.categoria = ?'; 
                params.push(categoriaFiltro);
            }
            sql += ' ORDER BY p.nome ASC';
        }
            
        const [produtos] = await db.query(sql, params);
        res.json(produtos);

    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao listar produtos.' });
    }
};

exports.buscarPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT p.*, IFNULL(e.quantidade, 0) AS estoque 
            FROM produtos p
            LEFT JOIN estoque e ON p.id = e.produto_id
            WHERE p.id = ?
        `;
        const [produto] = await db.query(sql, [id]);

        if (produto.length === 0) {
            return res.status(404).json({ status: 'erro', mensagem: 'Produto não encontrado.' });
        }
        res.json(produto[0]);
    } catch (error) {
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar produto.' });
    }
};

exports.atualizar = async (req, res, next) => {
    const { id } = req.params;
    const { 
        nome, descricao, preco, custo_unitario, categoria, linha, caminho_imagem, 
        estoque_atualizado
    } = req.body;
    
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); 

        const destaque = req.body.destaque ? 1 : 0;
        const exibir_index = req.body.exibir_index ? 1 : 0;
        const exibir_page1 = req.body.exibir_page1 ? 1 : 0;
        const exibir_page2 = req.body.exibir_page2 ? 1 : 0;
        const promocao = req.body.promocao ? 1 : 0;
        const vCustoUnitario = (custo_unitario && parseFloat(custo_unitario) > 0) ? parseFloat(custo_unitario) : 0.00;

        const sqlProduto = `
            UPDATE produtos SET 
            nome = ?, descricao = ?, preco = ?, custo_unitario = ?, categoria = ?, linha = ?, 
            caminho_imagem = ?, destaque = ?, exibir_index = ?, exibir_page1 = ?, exibir_page2 = ?, promocao = ? 
            WHERE id = ?
        `;
        const [resultProduto] = await connection.query(sqlProduto, [
            nome, descricao, preco, vCustoUnitario,
            categoria, linha, caminho_imagem, 
            destaque, exibir_index, exibir_page1, exibir_page2, promocao, 
            id
        ]);

        if (resultProduto.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'erro', mensagem: 'Produto não encontrado.' });
        }

        if (estoque_atualizado !== undefined) {
            const estoque = parseInt(estoque_atualizado) || 0;
            const [saldoAtualRows] = await connection.query('SELECT IFNULL(quantidade, 0) AS quantidade FROM estoque WHERE produto_id = ? FOR UPDATE', [id]);
            const saldoAntigo = saldoAtualRows.length > 0 ? saldoAtualRows[0].quantidade : 0;
            const diferenca = estoque - saldoAntigo;

            if (diferenca !== 0) {
                const sqlEstoque = `
                    INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE quantidade = ?;
                `;
                await connection.query(sqlEstoque, [id, estoque, estoque]); 
                
                await connection.query(
                    'INSERT INTO movimentacoes_estoque (produto_id, tipo, origem, quantidade, usuario_id, data_hora) VALUES (?, ?, ?, ?, ?, NOW())',
                    [id, (diferenca > 0 ? 'entrada' : 'saida'), 'Ajuste Manual ADM', Math.abs(diferenca), 1]
                );
            }
        }

        await connection.commit(); 
        res.json({ status: 'sucesso', mensagem: 'Produto atualizado.' });

    } catch (error) {
        if (connection) await connection.rollback(); 
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar produto.' });
    } finally {
        if (connection) connection.release();
    }
};

exports.remover = async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await pool.getConnection();
        await connection.beginTransaction(); 

        const [saldoRows] = await connection.query('SELECT IFNULL(quantidade, 0) AS saldo_atual FROM estoque WHERE produto_id = ? FOR UPDATE', [id]);
        const saldoAtual = (saldoRows.length > 0) ? saldoRows[0].saldo_atual : 0;

        await connection.query(
            'INSERT INTO movimentacoes_estoque (produto_id, tipo, origem, quantidade, usuario_id, data_hora) VALUES (?, ?, ?, ?, ?, NOW())',
            [id, 'saida', 'Exclusão de Produto', saldoAtual, 1]
        );

        await connection.query('DELETE FROM itens_pedido WHERE produto_id = ?', [id]);
        await connection.query('DELETE FROM estoque WHERE produto_id = ?', [id]); 
        await connection.query('DELETE FROM avaliacoes WHERE produto_id = ?', [id]); 
        await connection.query('DELETE FROM carrinho WHERE produto_id = ?', [id]); 
        const [resultado] = await connection.query('DELETE FROM produtos WHERE id = ?', [id]);
        
        await connection.commit();

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ status: 'erro', message: 'Produto não encontrado.' });
        }
        res.status(200).json({ status: 'sucesso', message: 'Produto removido.' }); 
        
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ status: 'erro', message: 'Erro ao remover produto.' });
    } finally {
        if (connection) connection.release();
    }
};