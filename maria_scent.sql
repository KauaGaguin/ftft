SET SQL_SAFE_UPDATES = 0;

-- ==================================================
-- 1. USUÁRIOS E AUTENTICAÇÃO
-- ==================================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'funcionario', 'cliente') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recuperacao_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiracao DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Nova: PREFERÊNCIAS DE COMUNICAÇÃO
CREATE TABLE preferencias_usuario (
    usuario_id INT PRIMARY KEY,
    receber_email BOOLEAN DEFAULT TRUE,
    receber_whatsapp BOOLEAN DEFAULT TRUE,
    notificar_status BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Nova: ENDEREÇOS
CREATE TABLE enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    apelido VARCHAR(50), -- Ex: Casa, Trabalho
    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Nova: CARTÕES (TOKENIZADOS - SEGURO)
-- Nunca salvamos o número real, apenas o token do gateway e os últimos dígitos
CREATE TABLE cartoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome_titular VARCHAR(100) NOT NULL,
    ultimos_digitos VARCHAR(4) NOT NULL,
    validade VARCHAR(5) NOT NULL, -- MM/AA
    token_pagamento VARCHAR(255) NOT NULL, -- Token retornado pela API de Pagamento
    bandeira VARCHAR(20),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==================================================
-- 2. PRODUTOS E ESTOQUE
-- ==================================================

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NULL,
    preco DECIMAL(10,2) NOT NULL,
    custo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    categoria VARCHAR(50) NOT NULL,
    linha VARCHAR(50) NOT NULL,
    caminho_imagem VARCHAR(255),
    -- Flags de exibição
    destaque BOOLEAN DEFAULT FALSE,
    exibir_index BOOLEAN DEFAULT FALSE,
    exibir_page1 BOOLEAN DEFAULT FALSE,
    exibir_page2 BOOLEAN DEFAULT FALSE,
    promocao BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL UNIQUE,
    quantidade INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 5,
    estoque_maximo INT NOT NULL DEFAULT 100,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_estoque_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE movimentacoes_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    usuario_id INT NULL,
    tipo ENUM('entrada', 'saida', 'ajuste') NOT NULL,
    origem VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ==================================================
-- 3. MARKETING E VENDAS
-- ==================================================

CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wishlist (usuario_id, produto_id)
);

CREATE TABLE cupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo_desconto ENUM('fixo', 'percentual') NOT NULL,
    valor_desconto DECIMAL(10,2) NOT NULL,
    data_validade DATETIME NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banners_agendados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensagem VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    data_inicio DATETIME NULL,
    data_fim DATETIME NULL,
    prioridade INT DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 4. PEDIDOS E CARRINHO
-- ==================================================

CREATE TABLE carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    status ENUM('pendente','pronto','entregue','concluido','recusado','cancelado','aguardando_pagamento') DEFAULT 'pendente' NOT NULL,
    cupom_aplicado VARCHAR(50) NULL,
    valor_subtotal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    valor_desconto DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    valor_frete DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    valor_total DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_finalizacao TIMESTAMP NULL,
    endereco_entrega TEXT NULL,
    codigo_rastreio VARCHAR(100) NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    nota INT CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo VARCHAR(50),
    mensagem TEXT,
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cliente VARCHAR(100),
    email_cliente VARCHAR(100),
    mensagem TEXT,
    resposta TEXT,
    respondido_por INT,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ==================================================
-- 5. DADOS INICIAIS (OBRIGATÓRIOS APENAS USUÁRIOS)
-- ==================================================

INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Admin Maria Scent', 'admin@mariascent.com', '$2b$10$EEBPsQe.Bl4FYPLTHHH8YuGLO3Moeag2T18.FBNviDxjn6e4yw5Ei', 'admin'),
('Funcionário 1', 'func1@mariascent.com', '$2b$10$C7a.b3d7.e2f5.g6h0i1.j2k3l4m5n6o7p8q9r0s', 'funcionario'),
('Funcionário 2', 'func2@mariascent.com', '$2b$10$D8b.c4e8.f3g6.h1i2.k3l4m5n6o7p8q9r0s1t2u', 'funcionario'),
('Cliente Teste', 'cliente@teste.com', '$2b$10$E9c.d5f9.g4h7.i2j3.l4m5n6o7p8q9r0s1t2u3v4w', 'cliente');