const pool = require('./db');
const db = pool;

/**
 * ✅ GET /api/stats/estoque-baixo
 * (Corrige o "Card de Estoque Baixo")
 * Busca produtos com estoque <= 5 (baseado no seu SQL 'estoque_minimo INT NOT NULL DEFAULT 5')
 */
exports.getEstoqueBaixo = async (req, res, next) => {
    try {
        // Usando o estoque_minimo da tabela 'estoque'
        const sql = `
            SELECT 
                p.nome,
                e.quantidade AS estoque
            FROM estoque e
            JOIN produtos p ON e.produto_id = p.id
            WHERE e.quantidade <= e.estoque_minimo AND e.quantidade > 0
            ORDER BY e.quantidade ASC;
        `;
        
        const [produtos] = await db.query(sql);
        
        console.log(`[Stats] Buscando estoque baixo (<= estoque_minimo). Encontrados: ${produtos.length}`);
        
        // O adm.js espera um array de produtos
        res.json(produtos);

    } catch (error) {
        console.error('Erro ao buscar estoque baixo:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar estatísticas de estoque.', detalhes: error.message });
    }
};

/**
 * ✅ GET /api/stats/dashboard
 * Busca as estatísticas reais para o dashboard (Vendas, Pendentes, etc.)
 */
exports.getDashboardStats = async (req, res) => {
    let connection;
    try {
        console.log("[Stats] Buscando estatísticas do Dashboard...");
        connection = await db.getConnection();

        // 1. Vendas Hoje (Pedidos concluídos hoje)
        const sqlVendasHoje = `
            SELECT SUM(valor_total) AS total 
            FROM pedidos 
            WHERE status = 'concluido' AND DATE(data_pedido) = CURDATE()
        `;
        const [vendasHojeRes] = await connection.query(sqlVendasHoje);
        
        // 2. Produtos Cadastrados
        const sqlProdutos = `SELECT COUNT(id) AS total FROM produtos`;
        const [produtosRes] = await connection.query(sqlProdutos);

        // 3. Venda Total (Todos os pedidos concluídos)
        const sqlVendaTotal = `SELECT SUM(valor_total) AS total FROM pedidos WHERE status = 'concluido'`;
        const [vendaTotalRes] = await connection.query(sqlVendaTotal);

        // 4. Pedidos Pendentes (Usando os status do seu SQL)
        const sqlPedidosPendentes = `
            SELECT COUNT(id) AS total 
            FROM pedidos 
            WHERE status = 'pendente'
        `;
        const [pedidosPendentesRes] = await connection.query(sqlPedidosPendentes);

        // 5. Estoque Baixo (Contagem)
        const sqlEstoqueBaixo = `
            SELECT COUNT(produto_id) AS total 
            FROM estoque 
            WHERE quantidade <= estoque_minimo AND quantidade > 0
        `;
        const [estoqueBaixoRes] = await connection.query(sqlEstoqueBaixo);

        // 6. Rentabilidade (Custo vs Venda dos últimos 30 dias)
        // (Seu SQL de produto tem 'custo_unitario')
        const sqlRentabilidade = `
            SELECT 
                SUM(ip.quantidade * ip.preco_unitario) AS faturamento,
                SUM(ip.quantidade * p.custo_unitario) AS custo
            FROM itens_pedido ip
            JOIN produtos p ON ip.produto_id = p.id
            JOIN pedidos ped ON ip.pedido_id = ped.id
            WHERE ped.status = 'concluido' AND ped.data_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;
        const [rentabilidadeRes] = await connection.query(sqlRentabilidade);
        
        let faturamento = 0;
        let custo = 0;
        
        if (rentabilidadeRes.length > 0 && rentabilidadeRes[0].faturamento) {
            faturamento = parseFloat(rentabilidadeRes[0].faturamento);
        }
        if (rentabilidadeRes.length > 0 && rentabilidadeRes[0].custo) {
            custo = parseFloat(rentabilidadeRes[0].custo);
        }
        
        const rentabilidadeMensal = faturamento - custo;

        // Monta a resposta
        const stats = {
            vendasHoje: vendasHojeRes[0].total || 0,
            produtosCadastrados: produtosRes[0].total || 0,
            vendaTotal: vendaTotalRes[0].total || 0,
            pedidosPendentes: pedidosPendentesRes[0].total || 0,
            estoqueBaixo: estoqueBaixoRes[0].total || 0,
            rentabilidadeMensal: rentabilidadeMensal
        };
        
        console.log("[Stats] Estatísticas do Dashboard:", stats);
        res.json(stats);

    } catch (error) {
        console.error('Erro ao buscar stats do dashboard:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar estatísticas do dashboard.', detalhes: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * ✅ GET /api/stats/fluxo-caixa
 * Busca dados reais para o gráfico de faturamento.
 */
exports.getFluxoCaixaChartData = async (req, res) => {
    try {
        console.log("[Stats] Buscando dados do Fluxo de Caixa...");
        // Busca o faturamento (pedidos concluídos) dos últimos 6 meses
        const sql = `
            SELECT 
                DATE_FORMAT(data_pedido, '%Y-%m') AS mes,
                SUM(valor_total) AS faturamento
            FROM pedidos
            WHERE status = 'concluido' AND data_pedido >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY mes
            ORDER BY mes ASC;
        `;
        
        const [rows] = await db.query(sql);

        // Formata para o Chart.js
        const labels = rows.map(r => r.mes);
        const data = rows.map(r => r.faturamento);

        console.log(`[Stats] Dados do gráfico: ${rows.length} meses encontrados.`);
        res.json({
            labels: labels,
            data: data
        });

    } catch (error) {
        console.error('Erro ao buscar dados do fluxo de caixa:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar dados do gráfico.', detalhes: error.message });
    }
};