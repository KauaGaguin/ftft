// banner.js
const pool = require('./db'); // Assumindo que db.js está na raiz

/**
 * [ROTA GET PARA O FRONT-END]
 * Lista os banners ativos no momento, verificando as datas.
 */
exports.getBannerAtivo = async (req, res, next) => {
    try {
        const [banners] = await pool.query(`
            SELECT mensagem 
            FROM banners_agendados
            WHERE 
                ativo = 1 
                AND (data_inicio IS NULL OR data_inicio <= NOW())
                AND (data_fim IS NULL OR data_fim >= NOW())
            ORDER BY prioridade DESC, data_criacao DESC
        `);
        
        // Retorna a lista de mensagens para o Front-end (interfase.js)
        res.json(banners);

    } catch (err) {
        console.error("Erro ao buscar banners ativos:", err);
        next(err);
    }
};

/**
 * [ROTA POST/PUT PARA O ADMIN]
 * Cria ou atualiza a configuração de um banner.
 * Nota: O Admin deve enviar o ID para edição, ou não enviar para criação.
 */
exports.gerenciarBanner = async (req, res, next) => {
    try {
        const { id, mensagem, ativo, data_inicio, data_fim, prioridade } = req.body;

        if (!mensagem) {
            return res.status(400).json({ message: 'A mensagem do banner é obrigatória.' });
        }

        const dataAtual = [
            mensagem, 
            ativo || 0, // Garante que ativo seja 0 ou 1
            data_inicio || null, 
            data_fim || null,
            prioridade || 0
        ];

        if (id) {
            // Se ID existe: ATUALIZAÇÃO (PUT)
            await pool.query(
                `UPDATE banners_agendados SET 
                 mensagem = ?, ativo = ?, data_inicio = ?, data_fim = ?, prioridade = ? 
                 WHERE id = ?`,
                [...dataAtual, id]
            );
            res.status(200).json({ message: `Banner #${id} atualizado com sucesso.` });
        } else {
            // Se ID não existe: CRIAÇÃO (POST)
            const [resultado] = await pool.query(
                `INSERT INTO banners_agendados (mensagem, ativo, data_inicio, data_fim, prioridade) 
                 VALUES (?, ?, ?, ?, ?)`,
                dataAtual
            );
            res.status(201).json({ id: resultado.insertId, message: 'Novo banner criado com sucesso.' });
        }

    } catch (err) {
        console.error("Erro ao gerenciar banner:", err);
        next(err);
    }
};

// Rota para deletar, se desejar
exports.removerBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM banners_agendados WHERE id = ?', [id]);
        res.status(200).json({ message: 'Banner removido.' });
    } catch (err) {
        next(err);
    }
};
// banner.js (Adicione esta função)
// ...

/**
 * [ROTA GET PARA O ADMIN]
 * Lista TODOS os banners (ativos e inativos).
 */
exports.getAllBanners = async (req, res, next) => {
    try {
        // Seleciona todos os campos necessários para o Admin
        const [banners] = await pool.query(`
            SELECT id, mensagem, ativo, data_inicio, data_fim, prioridade 
            FROM banners_agendados
            ORDER BY ativo DESC, prioridade DESC, data_fim DESC
        `);
        
        res.json(banners);

    } catch (err) {
        console.error("Erro ao buscar todos os banners:", err);
        next(err);
    }
};

// ...
// Certifique-se que o seu arquivo exporte todas as funções:
// module.exports = { getBannerAtivo, gerenciarBanner, removerBanner, getAllBanners };