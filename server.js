const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// --- CONFIGURAÇÃO DE IMAGENS (HÍBRIDO: LOCAL OU CLOUDINARY) ---
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

let upload;

// Verifica se as chaves do Cloudinary existem no arquivo .env
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    console.log("☁️  Modo de Upload: CLOUDINARY (Nuvem Ativada)");
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const cloudStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'maria-scent-produtos', // Nome da pasta que será criada no Cloudinary
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        },
    });
    upload = multer({ storage: cloudStorage });

} else {
    console.log("💻 Modo de Upload: LOCAL (Salvando na pasta do PC)");
    
    const localStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Salva na pasta local se não tiver internet ou chaves
            cb(null, 'src/main/webapp/img/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
    upload = multer({ storage: localStorage });
}

// Configuração do Banco de Dados
const pool = require('./src/main/webapp/js/routes/db'); 
const db = pool;

// Garante compatibilidade se o pool usar execute ou query
if (pool && typeof pool.execute === 'function') {
    db.query = pool.execute.bind(pool); 
}

// Caminho base para as rotas
const BASE_ROUTE_PATH = './src/main/webapp/js/routes';

// --- IMPORTAÇÃO SEGURA DOS CONTROLLERS ---
function requireController(nomeArquivo) {
    try {
        const modulo = require(`${BASE_ROUTE_PATH}/${nomeArquivo}`);
        return modulo;
    } catch (e) {
        console.warn(`⚠️ Aviso: Controller '${nomeArquivo}' não encontrado ou com erro de sintaxe.`);
        return null; 
    }
}

console.log("--- Inicializando Servidor Maria Scent ---");

// 1. Controllers Principais
const produtoRoutes = requireController('produto.router');
const carrinhoRoutes = requireController('carrinho');
const pedidoRoutes = requireController('pedido');
const avaliacaoRoutes = requireController('avaliacao');
const notificacaoRoutes = requireController('notificacao');
const categoriaRoutes = requireController('categoria'); 
const cupomRoutes = requireController('cupom');
const bannerController = requireController('banner');
const statsRoutes = requireController('stats');
const estoqueController = requireController('estoque'); 
const relatorioController = requireController('relatorio');

// 2. NOVOS CONTROLLERS
const promocaoController = requireController('promocao');
const enderecoController = requireController('endereco');
const cartaoController = requireController('cartao');
const wishlistController = requireController('wishlist');
const preferenciaController = requireController('preferencia');

const app = express();
const PORT = process.env.PORT || 3000; // Pega a porta do Railway ou usa 3000

// ==========================================================
// MIDDLEWARES (Configurações Globais)
// ==========================================================

// Configuração de CORS (Permite acesso do Frontend)
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',      // VS Code Live Server
        'http://localhost:5500',      // VS Code Live Server (alternativo)
        'http://localhost:3000',      // Teste local
        'https://maria-scent-api-production.up.railway.app' // SEU LINK REAL DO RAILWAY
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization'
}));

// Configuração para processar JSON e uploads grandes
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 

// Servir arquivos estáticos (Imagens locais e Frontend)
app.use('/assets', express.static('src/main/webapp/img')); // Rota para imagens locais
app.use(express.static(path.join(__dirname, '..'))); // Rota para o site (HTML/CSS/JS)

// ==========================================================
// ROTA DE UPLOAD (MUITO IMPORTANTE)
// ==========================================================
app.post('/api/upload', upload.single('imagem'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada.' });
    }
    
    // Se for Cloudinary, req.file.path já é o link https://...
    // Se for local, montamos o caminho manual
    const caminhoFinal = req.file.path ? req.file.path : `img/${req.file.filename}`;
    
    console.log(`📸 Imagem salva em: ${caminhoFinal}`);
    res.json({ caminho: caminhoFinal });
});

app.get('/', (req, res) => {
    res.send('API de E-commerce Maria Scent está rodando!');
});

// ==========================================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================================

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [results] = await db.query('SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ?', [email]);
        
        if (results.length === 0) return res.status(401).json({ message: 'E-mail não encontrado.' });
        
        const usuario = results[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (senhaValida) {
            res.json({ 
                status: 'ok', 
                user: { 
                    id: usuario.id, 
                    nome: usuario.nome, 
                    email: usuario.email, 
                    tipo: usuario.tipo 
                } 
            });
        } else {
            res.status(401).json({ message: 'Senha incorreta.' });
        }
    } catch (error) {
        console.error('Erro login:', error);
        return res.status(500).json({ message: 'Erro no servidor' }); 
    }
}); 

app.post('/api/registro', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, 10);
        await db.query('INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)', [nome, email, hash, 'cliente']);
        res.status(200).json({ mensagem: 'Registrado com sucesso!' });
    } catch (error) {
        console.error('Erro registro:', error);
        res.status(500).json({ erro: 'Erro ao registrar.', detalhes: error.message });
    }
});

app.post('/api/solicitar-recuperacao', async (req, res) => {
    const { email } = req.body;
    try {
        const [results] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (results.length === 0) return res.json({ status: 'ok', mensagem: 'Se este e-mail existir, um link será enviado.' });
        
        const usuario_id = results[0].id;
        const token = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '); 

        await db.query('DELETE FROM recuperacao_senha WHERE usuario_id = ?', [usuario_id]);
        await db.query('INSERT INTO recuperacao_senha (usuario_id, token, expiracao) VALUES (?, ?, ?)', [usuario_id, token, expiracao]);
        
        console.log(`Link Recuperação (Simulado): http://localhost:${PORT}/redefinir-senha.html?token=${token}`);
        res.json({ status: 'ok', mensagem: 'Link enviado (ver console).' });
    } catch (error) {
        console.error('Erro recuperação:', error);
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno.' });
    }
});

// ==========================================================
// REGISTRO DE ROTAS DA API
// ==========================================================

// Módulos Básicos
if (produtoRoutes) app.use('/api/produtos', produtoRoutes); 
if (pedidoRoutes) app.use('/api/pedido', pedidoRoutes); 
if (carrinhoRoutes) app.use('/api/carrinho', carrinhoRoutes); 
if (categoriaRoutes) app.use('/api/categorias', categoriaRoutes);
if (cupomRoutes) app.use('/api/cupom', cupomRoutes);
if (notificacaoRoutes) app.use('/api/notificacoes', notificacaoRoutes); 

// Dashboard e Stats
if (statsRoutes && statsRoutes.getDashboardStats) {
    app.get('/api/stats/dashboard', statsRoutes.getDashboardStats); 
    app.get('/api/stats/estoque-baixo', statsRoutes.getEstoqueBaixo); 
    app.get('/api/stats/fluxo-caixa', statsRoutes.getFluxoCaixaChartData); 
}

// Banners
if (bannerController && bannerController.getBannerAtivo) {
    app.get('/api/banner/ativo', bannerController.getBannerAtivo); 
    app.get('/api/banner/todos', bannerController.getAllBanners); 
    app.post('/api/banner', bannerController.gerenciarBanner); 
    app.put('/api/banner/:id', bannerController.gerenciarBanner); 
    app.delete('/api/banner/:id', bannerController.removerBanner); 
}

// Estoque
if (estoqueController && estoqueController.getEstoqueGerencial) {
    app.get('/api/estoque/gerencial', estoqueController.getEstoqueGerencial);
    app.get('/api/estoque/alertas', estoqueController.getAlertasEstoque);
    app.get('/api/estoque/historico/:produtoId', estoqueController.getHistoricoEstoque);
    app.post('/api/estoque', estoqueController.registrarMovimentacao); 
    app.put('/api/estoque/:id', estoqueController.atualizarItemEstoque); 
    
    // Rota manual de listagem
    app.get('/api/estoque', async (req, res) => {
        try {
            const [rows] = await db.query('SELECT p.id AS produto_id, p.nome AS nome_produto, IFNULL(e.quantidade, 0) AS quantidade FROM produtos p LEFT JOIN estoque e ON p.id = e.produto_id ORDER BY p.nome ASC');
            res.json(rows);
        } catch(e) { res.status(500).json({error: e.message}); }
    });
}

// Relatórios
if (relatorioController && relatorioController.gerarRelatorioEstoque) {
    app.get('/api/relatorios/estoque', relatorioController.gerarRelatorioEstoque);
    app.get('/api/relatorios/vendas', relatorioController.gerarRelatorioVendas); 
}

// Disparo de Promoções
if (promocaoController && promocaoController.dispararPromocao) {
    app.post('/api/promocao/disparar', promocaoController.dispararPromocao);
}

// ---------------------------------------------------------
// 🚀 ROTAS DO CLIENTE (BANCO DE DADOS)
// ---------------------------------------------------------

// Endereços
if (enderecoController) {
    app.get('/api/enderecos/:usuarioId', enderecoController.listar);
    app.post('/api/enderecos', enderecoController.adicionar);
    app.delete('/api/enderecos/:id', enderecoController.remover);
}

// Cartões
if (cartaoController) {
    app.get('/api/cartoes/:usuarioId', cartaoController.listar);
    app.post('/api/cartoes', cartaoController.adicionar);
    app.delete('/api/cartoes/:id', cartaoController.remover);
}

// Wishlist
if (wishlistController) {
    app.get('/api/wishlist/:usuarioId', wishlistController.listarItens);
    app.post('/api/wishlist', wishlistController.adicionarItem);
    app.delete('/api/wishlist/:usuarioId/:produtoId', wishlistController.removerItem);
    if (wishlistController.verificarPromocoes) {
        app.get('/api/wishlist/monitorar', wishlistController.verificarPromocoes);
    }
}

// Preferências
if (preferenciaController) {
    app.get('/api/preferencias/:usuarioId', preferenciaController.obter);
    app.post('/api/preferencias', preferenciaController.salvar);
}

// Rota Genérica para Produto (Fallback)
app.get('/api/produto/:id', async (req, res) => {
    try {
        const [r] = await db.query('SELECT p.*, IFNULL(e.quantidade, 0) AS estoque FROM produtos p LEFT JOIN estoque e ON p.id = e.produto_id WHERE p.id = ?', [req.params.id]);
        if(r.length > 0) res.json(r[0]);
        else res.status(404).json({ message: 'Produto não encontrado' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Rota para finalizar Pedido (Mudança de Status)
app.put('/api/pedido/finalizar/:id', async (req, res) => {
    try {
        await db.query("UPDATE pedidos SET status = 'concluido' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Status atualizado.' });
    } catch (e) { res.status(500).json({ message: 'Erro ao atualizar.' }); }
});

// Middleware de Erro Global
app.use((err, req, res, next) => {
    console.error('ERRO GLOBAL:', err.stack);
    res.status(500).json({ status: 'erro', message: 'Ocorreu um erro interno no servidor.' });
});

app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});