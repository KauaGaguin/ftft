const pool = require('./db');
const db = pool;

// 1. OBTER PREFERÊNCIAS (GET)
exports.obter = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM preferencias_usuario WHERE usuario_id = ?', [req.params.usuarioId]);
        
        if (rows.length === 0) {
            // Se o cliente nunca salvou, assumimos que ele ACEITA tudo (Padrão de Marketing)
            return res.json({ receber_email: 1, receber_whatsapp: 1, notificar_status: 1 });
        }
        
        // Retorna as configurações salvas
        res.json(rows[0]);

    } catch (e) {
        console.error("Erro ao buscar preferências:", e);
        res.status(500).json({ error: 'Erro ao carregar preferências.' });
    }
};

// 2. SALVAR PREFERÊNCIAS (POST)
exports.salvar = async (req, res) => {
    const { usuarioId, email, whatsapp, status } = req.body;

    if (!usuarioId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    try {
        // Lógica inteligente: Cria se não existe, Atualiza se já existe
        const sql = `
            INSERT INTO preferencias_usuario (usuario_id, receber_email, receber_whatsapp, notificar_status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            receber_email = VALUES(receber_email),
            receber_whatsapp = VALUES(receber_whatsapp),
            notificar_status = VALUES(notificar_status)
        `;
        
        await db.query(sql, [usuarioId, email, whatsapp, status]);
        res.json({ message: 'Preferências atualizadas com sucesso.' });

    } catch (e) {
        console.error("Erro ao salvar preferências:", e);
        res.status(500).json({ error: 'Erro ao salvar preferências.' });
    }
};