// =========================================================
// CARRINHO DE COMPRAS - VERSÃO API (BANCO DE DADOS)
// =========================================================

const API_CARRINHO = '/api/carrinho'; // Caminho relativo para funcionar no Railway

// Obtém o ID do usuário logado (Salvo no login)
// Se não tiver login, usa um ID temporário ou pede login (Ajuste conforme sua regra)
function getUsuarioId() {
    const user = JSON.parse(localStorage.getItem('usuario'));
    return user ? user.id : null; 
}

// 1. CARREGAR CARRINHO AO ABRIR O SITE
async function carregarCarrinho() {
    const usuarioId = getUsuarioId();
    if (!usuarioId) {
        atualizarBadge(0); // Usuário não logado vê 0
        return; 
    }

    try {
        const response = await fetch(`${API_CARRINHO}/${usuarioId}`);
        const itens = await response.json();
        
        renderizarCarrinho(itens);
        atualizarBadge(itens.length);
        atualizarTotais(itens);
        
    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
    }
}

// 2. ADICIONAR ITEM (Chamado pelo botão "Comprar")
async function adicionarAoCarrinho(produtoId, qtd = 1) {
    const usuarioId = getUsuarioId();
    
    if (!usuarioId) {
        alert("Por favor, faça login para adicionar itens ao carrinho.");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_CARRINHO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario_id: usuarioId, 
                produto_id: produtoId, 
                quantidade: qtd 
            })
        });

        if (response.ok) {
            // Notificação simples (Toast)
            if(window.salvarNotificacao) window.salvarNotificacao('Sucesso', 'Produto adicionado!');
            
            // Recarrega o carrinho para mostrar o novo item
            carregarCarrinho();
            
            // Abre o menu lateral automaticamente
            if(window.abrirMenu) window.abrirMenu('carrinho');
        } else {
            alert('Erro ao adicionar produto.');
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// 3. REMOVER ITEM
async function removerDoCarrinho(carrinhoId) {
    if(!confirm("Deseja remover este item?")) return;

    try {
        const response = await fetch(`${API_CARRINHO}/${carrinhoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarCarrinho(); // Atualiza a lista
        }
    } catch (error) {
        console.error("Erro ao remover:", error);
    }
}

// 4. ATUALIZAR HTML (Renderização)
function renderizarCarrinho(itens) {
    const container = document.getElementById('carrinho-lista');
    const vazioMsg = document.getElementById('carrinho-vazio');
    
    if (!container) return;

    container.innerHTML = ''; // Limpa lista atual

    if (itens.length === 0) {
        if(vazioMsg) vazioMsg.style.display = 'block';
        return;
    }

    if(vazioMsg) vazioMsg.style.display = 'none';

    itens.forEach(item => {
        // Resolve a imagem (Link Cloudinary ou Local)
        const imagemSrc = resolverImagem(item.caminho_imagem); 
        const precoUnitario = parseFloat(item.preco);
        const totalItem = precoUnitario * item.quantidade;

        const li = document.createElement('li');
        li.className = 'item-carrinho';
        li.innerHTML = `
            <img src="${imagemSrc}" alt="${item.nome}" class="cart-thumb" 
                 onerror="this.src='assets/imgex.png'">
            
            <div class="item-info">
                <h4>${item.nome}</h4>
                <p>Qtd: ${item.quantidade}</p>
                <span class="preco-item">R$ ${totalItem.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <button onclick="removerDoCarrinho(${item.id})" class="btn-remove-item">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(li);
    });
}

// 5. ATUALIZAR TOTAIS E BADGE
function atualizarTotais(itens) {
    const total = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    
    const subtotalEl = document.getElementById('carrinho-subtotal');
    const totalFinalEl = document.getElementById('carrinho-total-final');
    
    const totalFormatado = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    if(subtotalEl) subtotalEl.textContent = totalFormatado;
    if(totalFinalEl) totalFinalEl.textContent = totalFormatado;
}

function atualizarBadge(qtd) {
    // Procura todos os badges de carrinho na tela (Mobile e Desktop)
    const badges = document.querySelectorAll('.cart-count, #cart-badge');
    badges.forEach(badge => {
        badge.textContent = qtd;
        badge.style.display = qtd > 0 ? 'flex' : 'none';
    });
}

// 6. LIMPAR CARRINHO (Ação do botão "Limpar")
async function limparCarrinhoCompleto() {
    const usuarioId = getUsuarioId();
    if(!usuarioId) return;

    if(!confirm("Tem certeza que deseja esvaziar o carrinho?")) return;

    try {
        await fetch(`${API_CARRINHO}/limpar/${usuarioId}`, { method: 'DELETE' });
        carregarCarrinho();
    } catch(e) { console.error(e); }
}

// Função auxiliar de imagem (Reuso do arquivo de produtos)
function resolverImagem(caminho) {
    if (!caminho) return 'assets/imgex.png';
    if (caminho.startsWith('http')) return caminho;
    return caminho; 
}

// Inicializa ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarCarrinho();
    
    // Vincula botão limpar se existir
    const btnLimpar = document.querySelector('.btn-limpar');
    if(btnLimpar) {
        btnLimpar.onclick = limparCarrinhoCompleto;
    }
});

// Exporta para o HTML usar
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.limparCarrinho = limparCarrinhoCompleto;
window.carregarCarrinho = carregarCarrinho; // Para chamar após login