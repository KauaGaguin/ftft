// =========================================================
// USUARIO.JS - LÓGICA CENTRALIZADA DO CLIENTE (COMPLETA)
// =========================================================
const API_BASE_URL = '/api';
let usuarioGlobal = null;

window.addEventListener("DOMContentLoaded", () => {
    // 1. VERIFICAÇÃO DE SEGURANÇA
    const userStr = localStorage.getItem('usuarioLogado');
    let tipoUsuario = null;

    try {
        if (userStr && userStr.startsWith('{')) {
            usuarioGlobal = JSON.parse(userStr);
            tipoUsuario = usuarioGlobal.tipo;
        } else {
            tipoUsuario = localStorage.getItem('nivelUsuario');
            usuarioGlobal = { nome: localStorage.getItem('nomeUsuario'), email: localStorage.getItem('emailUsuario') };
        }
    } catch (e) { console.error(e); }

    // Permite 'cliente' e 'admin' (para testes)
    if (!tipoUsuario || (tipoUsuario !== 'cliente' && tipoUsuario !== 'admin')) {
        alert('Acesso restrito. Por favor, faça login como Cliente.');
        fazerLogout();
        return;
    }

    // 2. INICIALIZAÇÃO DA INTERFACE
    if (usuarioGlobal) {
        const primeiroNome = usuarioGlobal.nome ? usuarioGlobal.nome.split(' ')[0] : 'Cliente';
        document.getElementById('boas-vindas').textContent = `Olá, ${primeiroNome}!`;
        
        // Preencher Campos Básicos
        const inputNome = document.getElementById('nome');
        const inputEmail = document.getElementById('email');
        if(inputNome) inputNome.value = usuarioGlobal.nome || '';
        if(inputEmail) inputEmail.value = usuarioGlobal.email || '';

        // Carregar dados
        carregarDadosExtras();
        carregarEnderecos();
        carregarCartoes(); // Carrega cartões (e cria exemplo se vazio)
        carregarPreferencias(); // Carrega preferências
        renderizarWishlist();

        // Carregar Pedidos Reais
        if (usuarioGlobal.id) {
            carregarMeusPedidos(usuarioGlobal.id);
        }
    }

    configurarEventos();
    aplicarMascaras(); 
});

// --- MÁSCARAS E VALIDAÇÕES ---

function aplicarMascaras() {
    // Máscara de CPF (000.000.000-00)
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
            limparErro('cpf');
        });
    }

    // Máscara de Telefone ((00) 00000-0000)
    const telInput = document.getElementById('telefone');
    if (telInput) {
        telInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 2) {
                value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
            }
            if (value.length > 9) {
                value = `${value.substring(0, 10)}-${value.substring(10)}`;
            }
            e.target.value = value;
            limparErro('telefone');
        });
    }

    // Máscara CEP
    const cepInput = document.getElementById('end-cep');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
            limparErro('end-cep');
        });
    }

    // Máscara Cartão
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 16) value = value.slice(0, 16);
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
            limparErro('card-number');
        });
    }
    
    // Máscara Validade Cartão (MM/AA)
    const cardExpiry = document.getElementById('card-expiry');
    if(cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) value = value.slice(0, 4);
            if (value.length > 2) {
                value = `${value.substring(0, 2)}/${value.substring(2)}`;
            }
            e.target.value = value;
            limparErro('card-expiry');
        });
    }
}

function mostrarErro(idCampo, mensagem) {
    const input = document.getElementById(idCampo);
    const errorMsg = document.getElementById(`error-${idCampo}`);
    if (input) input.classList.add('input-error');
    if (errorMsg) errorMsg.textContent = mensagem;
}

function limparErro(idCampo) {
    const input = document.getElementById(idCampo);
    const errorMsg = document.getElementById(`error-${idCampo}`);
    if (input) input.classList.remove('input-error');
    if (errorMsg) errorMsg.textContent = '';
}

// --- FUNÇÕES GERAIS ---

function fazerLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function configurarEventos() {
    document.getElementById('logout-link')?.addEventListener('click', (e) => {
        e.preventDefault(); fazerLogout();
    });

    document.getElementById('btn-salvar-dados')?.addEventListener('click', salvarDadosPessoais);
    
    // Botão de Salvar Preferências
    document.getElementById('btn-salvar-pref')?.addEventListener('click', salvarPreferencias);

    const links = document.querySelectorAll('.menu-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navegarParaAba(e.currentTarget.getAttribute('data-target'));
        });
    });

    const cards = document.querySelectorAll('.card-link');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const target = card.getAttribute('data-target');
            navegarParaAba(target);
        });
    });
}

function navegarParaAba(targetId) {
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    const menuLink = document.querySelector(`.menu-link[data-target="${targetId}"]`);
    if(menuLink) menuLink.classList.add('active');

    const targetSection = document.getElementById(targetId);
    if(targetSection) targetSection.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- LÓGICA DE PEDIDOS ---
async function carregarMeusPedidos(usuarioId) {
    const container = document.getElementById('lista-pedidos-completa');
    const resumoUltimo = document.getElementById('ultimo-pedido-resumo');
    const elTotalPedidos = document.getElementById('total-pedidos');
    const elPedidosCaminho = document.getElementById('pedidos-caminho');
    
    try {
        const response = await fetch(`${API_BASE_URL}/pedido/meus?usuarioId=${usuarioId}`);
        if (!response.ok) throw new Error('Erro na API');
        const pedidos = await response.json();

        if(elTotalPedidos) elTotalPedidos.textContent = pedidos.length;
        
        const aCaminho = pedidos.filter(p => p.status === 'pendente' || p.status === 'pronto').length;
        if(elPedidosCaminho) elPedidosCaminho.textContent = aCaminho;

        if (pedidos.length === 0) {
            if(container) container.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            if(resumoUltimo) resumoUltimo.innerHTML = '<p>Sem pedidos recentes.</p>';
            return;
        }

        if (container) {
            let html = `<table class="table-pedidos"><thead><tr><th>Pedido</th><th>Data</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
            pedidos.forEach(p => {
                const statusClass = p.status === 'concluido' ? 'status-concluido' : (p.status === 'cancelado' ? 'status-cancelado' : 'status-pendente');
                html += `
                    <tr>
                        <td>#${p.id}</td>
                        <td>${new Date(p.data_pedido).toLocaleDateString('pt-BR')}</td>
                        <td>R$ ${parseFloat(p.valor_total).toFixed(2).replace('.',',')}</td>
                        <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                        <td>
                            <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="verDetalhesPedido(${p.id})">
                                <i class="fas fa-eye"></i> Detalhes
                            </button>
                        </td>
                    </tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        if (resumoUltimo) {
            const ultimo = pedidos[0];
            const statusClassUltimo = ultimo.status === 'concluido' ? 'status-concluido' : 'status-pendente';
            resumoUltimo.innerHTML = `
                <div onclick="verDetalhesPedido(${ultimo.id})" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; transition: all 0.2s;">
                    <div>
                        <strong>Pedido #${ultimo.id}</strong><br>
                        <small>${new Date(ultimo.data_pedido).toLocaleDateString('pt-BR')} - R$ ${parseFloat(ultimo.valor_total).toFixed(2).replace('.',',')}</small>
                    </div>
                    <div style="text-align:right;">
                        <span class="status-badge ${statusClassUltimo}">${ultimo.status}</span>
                        <div style="font-size: 11px; color: #999; margin-top: 5px;">Ver detalhes</div>
                    </div>
                </div>
                <a href="#pedidos" onclick="navegarParaAba('pedidos')" style="display:block; margin-top:10px; font-size:13px; color: #bfa14a; text-align: right; cursor: pointer;">Ver todos os pedidos</a>
            `;
        }

    } catch (error) {
        console.error(error);
        if(container) container.innerHTML = '<p style="color:red;">Não foi possível carregar os pedidos.</p>';
    }
}

async function verDetalhesPedido(pedidoId) {
    const modal = document.getElementById('modal-detalhes-pedido');
    const elId = document.getElementById('modal-pedido-id');
    const elData = document.getElementById('modal-data');
    const elStatus = document.getElementById('modal-status');
    const elRastreio = document.getElementById('modal-rastreio');
    const elLista = document.getElementById('modal-lista-itens');
    const elEnd = document.getElementById('modal-endereco');
    const elSub = document.getElementById('modal-subtotal');
    const elFrete = document.getElementById('modal-frete');
    const elDesc = document.getElementById('modal-desconto');
    const elTotal = document.getElementById('modal-total');

    modal.style.display = 'flex';
    elLista.innerHTML = '<p>Carregando itens...</p>';

    try {
        const res = await fetch(`${API_BASE_URL}/pedido/${pedidoId}`);
        if(!res.ok) throw new Error('Erro ao buscar detalhes');
        const dados = await res.json();

        elId.textContent = dados.id;
        elData.textContent = new Date(dados.data_pedido).toLocaleString('pt-BR');
        elStatus.textContent = dados.status;
        elStatus.className = `status-badge status-${dados.status === 'concluido' ? 'concluido' : 'pendente'}`;
        elRastreio.textContent = dados.codigo_rastreio || 'Ainda não disponível';
        elEnd.textContent = dados.endereco_entrega || 'Endereço não registrado';

        const subtotal = parseFloat(dados.valor_total) - parseFloat(dados.valor_frete) + parseFloat(dados.valor_desconto);
        elSub.textContent = `R$ ${subtotal.toFixed(2).replace('.',',')}`;
        elFrete.textContent = `R$ ${parseFloat(dados.valor_frete).toFixed(2).replace('.',',')}`;
        elDesc.textContent = `- R$ ${parseFloat(dados.valor_desconto).toFixed(2).replace('.',',')}`;
        elTotal.textContent = `R$ ${parseFloat(dados.valor_total).toFixed(2).replace('.',',')}`;

        if(dados.itens && dados.itens.length > 0) {
            elLista.innerHTML = dados.itens.map(item => `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                    <img src="${item.caminho_imagem || 'img/placeholder.png'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; background: #eee;">
                    <div style="flex: 1;">
                        <strong style="font-size: 14px; display: block;">${item.nome_produto}</strong>
                        <small style="color: #777;">Qtd: ${item.quantidade} x R$ ${parseFloat(item.preco_unitario).toFixed(2).replace('.',',')}</small>
                    </div>
                    <div style="font-weight: bold; font-size: 14px;">
                        R$ ${(item.quantidade * item.preco_unitario).toFixed(2).replace('.',',')}
                    </div>
                </div>
            `).join('');
        } else {
            elLista.innerHTML = '<p>Nenhum item encontrado.</p>';
        }

    } catch (e) {
        console.error(e);
        elLista.innerHTML = '<p style="color:red">Erro ao carregar detalhes.</p>';
    }
}

// --- 2. LÓGICA DE DADOS PESSOAIS (COM VALIDAÇÃO) ---

function carregarDadosExtras() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    const dadosExtras = JSON.parse(localStorage.getItem(`dados_extras_${usuarioGlobal.id}`)) || {};
    
    const elCpf = document.getElementById('cpf');
    const elNasc = document.getElementById('nascimento');
    const elTel = document.getElementById('telefone');

    if(elCpf) elCpf.value = dadosExtras.cpf || '';
    if(elNasc) elNasc.value = dadosExtras.nascimento || '';
    if(elTel) elTel.value = dadosExtras.telefone || '';
}

function salvarDadosPessoais() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    
    // VALIDAÇÃO
    let erro = false;
    
    if (cpf.length < 14) { 
        mostrarErro('cpf', 'CPF incompleto');
        erro = true;
    } else {
        limparErro('cpf');
    }

    if (telefone.length < 14) {
        mostrarErro('telefone', 'Telefone incompleto');
        erro = true;
    } else {
        limparErro('telefone');
    }

    if (erro) return;

    const dados = {
        cpf: cpf,
        nascimento: document.getElementById('nascimento').value,
        telefone: telefone
    };
    
    localStorage.setItem(`dados_extras_${usuarioGlobal.id}`, JSON.stringify(dados));
    alert('Dados atualizados com sucesso!');
}

// --- 3. LÓGICA DE ENDEREÇOS ---

function carregarEnderecos() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    const lista = JSON.parse(localStorage.getItem(`enderecos_${usuarioGlobal.id}`)) || [];
    const container = document.getElementById('lista-enderecos');
    
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p style="color:#777; grid-column: 1/-1;">Nenhum endereço cadastrado.</p>';
        return;
    }
    
    container.innerHTML = lista.map((end, index) => `
        <div class="card-box">
            <div class="card-tag">${end.apelido || 'Casa'}</div>
            <strong>${end.rua}, ${end.numero}</strong><br>
            <small>${end.bairro} - ${end.cidade}/${end.uf}</small><br>
            <small>CEP: ${end.cep}</small>
            <div class="card-actions">
                <button class="btn btn-outline" style="padding: 5px; font-size: 12px;" onclick="removerEndereco(${index})">Excluir</button>
            </div>
        </div>
    `).join('');
}

window.novoEndereco = function() {
    const form = document.getElementById('form-novo-endereco');
    if(form) {
        form.style.display = 'block';
        document.getElementById('end-cep')?.focus();
    }
};

window.cancelarEndereco = function() {
    const form = document.getElementById('form-novo-endereco');
    if(form) form.style.display = 'none';
    limparErro('end-cep');
    limparErro('end-rua');
    limparErro('end-numero');
};

window.salvarEndereco = function() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    const novo = {
        apelido: document.getElementById('end-apelido').value,
        cep: document.getElementById('end-cep').value,
        rua: document.getElementById('end-rua').value,
        numero: document.getElementById('end-numero').value,
        bairro: document.getElementById('end-bairro').value,
        cidade: document.getElementById('end-cidade').value,
        uf: document.getElementById('end-uf').value
    };
    
    let erro = false;
    if(!novo.cep || novo.cep.length < 9) { mostrarErro('end-cep', 'CEP inválido'); erro = true; } else limparErro('end-cep');
    if(!novo.rua) { mostrarErro('end-rua', 'Rua obrigatória'); erro = true; } else limparErro('end-rua');
    if(!novo.numero) { mostrarErro('end-numero', 'Número obrigatório'); erro = true; } else limparErro('end-numero');
    
    if(erro) return;
    
    const lista = JSON.parse(localStorage.getItem(`enderecos_${usuarioGlobal.id}`)) || [];
    lista.push(novo);
    localStorage.setItem(`enderecos_${usuarioGlobal.id}`, JSON.stringify(lista));
    
    cancelarEndereco();
    carregarEnderecos();
    
    document.querySelectorAll('#form-novo-endereco input').forEach(i => i.value = '');
};

window.removerEndereco = function(index) {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    if(!confirm('Remover endereço?')) return;
    
    const lista = JSON.parse(localStorage.getItem(`enderecos_${usuarioGlobal.id}`)) || [];
    lista.splice(index, 1);
    localStorage.setItem(`enderecos_${usuarioGlobal.id}`, JSON.stringify(lista));
    carregarEnderecos();
};

// --- 4. LÓGICA DE PAGAMENTO (COM MOCKUP) ---

function carregarCartoes() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    // Chave do LocalStorage
    const key = `cartoes_${usuarioGlobal.id}`;
    
    // Tenta ler
    let lista = JSON.parse(localStorage.getItem(key));

    // 💡 CORREÇÃO: SE NÃO EXISTIR, CRIA UM FAKE E SALVA
    if (!lista) {
        lista = [
            {
                numero: '5500 0000 0000 8890',
                nome: 'MARIA S SANTOS',
                validade: '12/28',
                cvv: '123'
            }
        ];
        localStorage.setItem(key, JSON.stringify(lista));
    }

    const container = document.getElementById('lista-cartoes');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p style="color:#777; grid-column: 1/-1;">Nenhum cartão cadastrado.</p>';
        return;
    }
    
    container.innerHTML = lista.map((card, index) => {
        let icon = 'fa-credit-card';
        let color = '#555';
        const numLimpo = card.numero.replace(/\D/g, '');
        if(numLimpo.startsWith('4')) { icon = 'fab fa-cc-visa'; color = '#1a1f71'; }
        else if(numLimpo.startsWith('5')) { icon = 'fab fa-cc-mastercard'; color = '#eb001b'; }

        return `
        <div class="card-box">
            <div class="card-tag">Principal</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="${icon}" style="font-size: 30px; color: ${color};"></i>
                <strong>**** ${card.numero.slice(-4)}</strong>
            </div>
            <p style="font-size: 12px; color: #666;">Validade: ${card.validade}</p>
            <p style="font-size: 12px; color: #666;">${card.nome}</p>
            <div class="card-actions">
                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="removerCartao(${index})">Remover</button>
            </div>
        </div>
    `}).join('');
}

window.novoCartao = function() {
    const form = document.getElementById('form-novo-cartao');
    if(form) {
        form.style.display = 'block';
        document.getElementById('card-number')?.focus();
    }
};

window.cancelarCartao = function() {
    const form = document.getElementById('form-novo-cartao');
    if(form) form.style.display = 'none';
    limparErro('card-number');
    limparErro('card-name');
    limparErro('card-expiry');
    limparErro('card-cvv');
};

window.salvarCartao = function() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    const novo = {
        numero: document.getElementById('card-number').value,
        nome: document.getElementById('card-name').value,
        validade: document.getElementById('card-expiry').value,
        cvv: document.getElementById('card-cvv').value
    };
    
    let erro = false;
    if(!novo.numero || novo.numero.length < 16) { mostrarErro('card-number', 'Número inválido'); erro = true; } else limparErro('card-number');
    if(!novo.nome) { mostrarErro('card-name', 'Nome obrigatório'); erro = true; } else limparErro('card-name');
    if(!novo.validade || novo.validade.length < 5) { mostrarErro('card-expiry', 'Data inválida'); erro = true; } else limparErro('card-expiry');
    if(!novo.cvv || novo.cvv.length < 3) { mostrarErro('card-cvv', 'CVV inválido'); erro = true; } else limparErro('card-cvv');

    if(erro) return;
    
    const lista = JSON.parse(localStorage.getItem(`cartoes_${usuarioGlobal.id}`)) || [];
    lista.push(novo);
    localStorage.setItem(`cartoes_${usuarioGlobal.id}`, JSON.stringify(lista));
    
    cancelarCartao();
    carregarCartoes();
    
    document.querySelectorAll('#form-novo-cartao input').forEach(i => i.value = '');
};

window.removerCartao = function(index) {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    if(!confirm('Remover cartão?')) return;
    
    const lista = JSON.parse(localStorage.getItem(`cartoes_${usuarioGlobal.id}`)) || [];
    lista.splice(index, 1);
    localStorage.setItem(`cartoes_${usuarioGlobal.id}`, JSON.stringify(lista));
    carregarCartoes();
};

// --- 5. LÓGICA DE PREFERÊNCIAS ---

function carregarPreferencias() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    const key = `preferencias_${usuarioGlobal.id}`;
    const prefs = JSON.parse(localStorage.getItem(key)) || {
        email: true,
        whatsapp: true,
        status: true
    };

    const elEmail = document.getElementById('pref-email');
    const elWhatsapp = document.getElementById('pref-whatsapp');
    const elStatus = document.getElementById('pref-status');

    if(elEmail) elEmail.checked = prefs.email;
    if(elWhatsapp) elWhatsapp.checked = prefs.whatsapp;
    if(elStatus) elStatus.checked = prefs.status;
}

function salvarPreferencias() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    
    const prefs = {
        email: document.getElementById('pref-email').checked,
        whatsapp: document.getElementById('pref-whatsapp').checked,
        status: document.getElementById('pref-status').checked
    };

    const key = `preferencias_${usuarioGlobal.id}`;
    localStorage.setItem(key, JSON.stringify(prefs));
    alert('Preferências salvas com sucesso!');
}

// --- 6. LÓGICA DE WISHLIST ---

function renderizarWishlist() {
    if(!usuarioGlobal || !usuarioGlobal.id) return;

    const wishlistKey = `wishlist_${usuarioGlobal.id}`;
    
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey));

    if (!wishlist) {
        wishlist = [
            { nome: 'Perfume Lavanda', preco: '89,90', img: 'img/imgex.png' },
            { nome: 'Kit Presente', preco: '120,00', img: 'img/imagem-destaque.png' }
        ];
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }

    const elTotalWishlist = document.getElementById('total-wishlist');
    if(elTotalWishlist) elTotalWishlist.textContent = wishlist.length;

    const container = document.getElementById('wishlist-container');
    if(!container) return;

    if (wishlist.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; color: #777;">Sua lista de desejos está vazia.</p>';
        return;
    }

    container.innerHTML = wishlist.map(p => `
        <div class="card-box" style="text-align:center; position: relative;">
            <button onclick="removerDaWishlist('${p.nome}')" title="Remover da lista" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: #999; font-size: 16px; cursor: pointer; transition: color 0.2s;">
                <i class="fas fa-times"></i>
            </button>
            <div style="width:80px; height:80px; background:#eee; border-radius:50%; margin:0 auto 10px; overflow:hidden;">
                 <img src="${p.img}" onerror="this.style.display='none'" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <h4 style="margin:0; font-size:14px;">${p.nome}</h4>
            <p style="color: #bfa14a; font-weight:bold;">R$ ${p.preco}</p>
            <button class="btn" style="width:100%; justify-content:center; margin-top:10px; font-size:12px;">Comprar</button>
        </div>
    `).join('');
}

window.removerDaWishlist = function(nomeProduto) {
    if(!usuarioGlobal || !usuarioGlobal.id) return;
    if(!confirm('Deseja remover este item da sua lista?')) return;

    const wishlistKey = `wishlist_${usuarioGlobal.id}`;
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];

    const novaWishlist = wishlist.filter(item => item.nome !== nomeProduto);

    localStorage.setItem(wishlistKey, JSON.stringify(novaWishlist));

    renderizarWishlist();
};