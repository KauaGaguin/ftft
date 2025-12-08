/* =========================================================
   INTEGRAÇÃO DE PRODUTOS (CORREÇÃO DEFINITIVA DE IMAGEM & RAILWAY)
   ========================================================= */

let PRODUTOS_GLOBAIS = [];
let produtoAtualModal = null;
let tamanhoSelecionado = null;

const VITRINES = {
    'linha-promocoes': { filter: p => p.promocao == 1 },
    'linha-destaques': { filter: p => p.destaque == 1 && !p.promocao },
    'linha-masculino': { filter: p => p.categoria && p.categoria.toLowerCase() === 'masculino' },
    'linha-feminino': { filter: p => p.categoria && p.categoria.toLowerCase() === 'feminino' },
    'linha-todos': { filter: p => true }
};

// Função Auxiliar: Decide se a imagem é Link Externo ou Arquivo Local
function resolverImagem(caminho) {
    if (!caminho) return 'img/imgex.png'; // Imagem padrão
    
    // Se já tiver "http" (link do Cloudinary ou outro site), usa direto
    if (caminho.startsWith('http://') || caminho.startsWith('https://')) {
        return caminho;
    }
    
    // Se não, assume que é local e adiciona o caminho da pasta
    return caminho; 
}

function gerarHTMLCardProduto(produto) {
    const preco = parseFloat(produto.preco || 0).toFixed(2).replace('.', ',');
    const imagemSrc = resolverImagem(produto.caminho_imagem);

    // Lógica de Wishlist (Mantida no LocalStorage por enquanto para agilidade)
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const activeClass = wishlist.includes(produto.id) ? 'active' : '';
    const iconClass = wishlist.includes(produto.id) ? 'fas' : 'far';

    return `
        <div class="card-produto" onclick="abrirModalProduto(${produto.id})">
            <div class="img-wrapper">
                <button class="btn-wishlist ${activeClass}" onclick="toggleWishlist(event, ${produto.id})">
                    <i class="${iconClass} fa-heart"></i>
                </button>
                <button class="btn-quick-add" onclick="event.stopPropagation(); comprarDireto(${produto.id})">
                    <i class="fas fa-shopping-bag"></i>
                </button>
                
                <img src="${imagemSrc}" 
                     loading="lazy" 
                     onerror="this.onerror=null; this.src='assets/imgex.png';">
            </div>
            
            <h3>${produto.nome}</h3>
            
            <div class="card-rating">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>

            <p class="card-short-desc">${produto.descricao || "Fragrância Exclusiva"}</p>
            
            <div class="card-price">R$ ${preco}</div>
        </div>
    `;
}

async function abrirModalProduto(id) {
    let produto = PRODUTOS_GLOBAIS.find(p => p.id == id);
    if (!produto) {
        try {
            // CORREÇÃO: Caminho relativo para funcionar no Railway
            const res = await fetch(`/api/produto/${id}`);
            produto = await res.json();
        } catch (e) { console.error(e); return; }
    }

    produtoAtualModal = produto;
    const modal = document.getElementById('modal-produto');
    const imgWrapper = modal.querySelector('.modal-img img');
    
    imgWrapper.src = resolverImagem(produto.caminho_imagem);
    imgWrapper.onerror = function() { this.src = 'assets/imgex.png'; };

    document.getElementById('modal-nome').innerText = produto.nome;
    document.getElementById('modal-desc').innerText = produto.descricao || "Sem descrição.";
    document.getElementById('modal-preco').innerText = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;

    const containerTamanhos = modal.querySelector('.size-selector');
    if(containerTamanhos) containerTamanhos.innerHTML = '';
    const labelTam = modal.querySelector('.modal-options label');
    if(labelTam) labelTam.style.display = 'none';

    const btnAdd = document.getElementById('modal-btn-add');
    const novoBtn = btnAdd.cloneNode(true);
    btnAdd.parentNode.replaceChild(novoBtn, btnAdd);
    
    novoBtn.onclick = () => {
        comprarDireto(produto.id);
        fecharModalProduto();
    };

    modal.style.display = 'flex';
}

function comprarDireto(id) {
    if(window.adicionarAoCarrinho) {
        window.adicionarAoCarrinho(id, 1, "Único");
        if(window.abrirMenu) window.abrirMenu('carrinho');
    }
}

function fecharModalProduto() {
    const modal = document.getElementById('modal-produto');
    if(modal) modal.style.display = 'none';
}

function toggleWishlist(event, id) {
    event.stopPropagation();
    let list = JSON.parse(localStorage.getItem('wishlist')) || [];
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');

    if (list.includes(id)) {
        list = list.filter(i => i !== id);
        btn.classList.remove('active');
        icon.classList.replace('fas', 'far');
    } else {
        list.push(id);
        btn.classList.add('active');
        icon.classList.replace('far', 'fas');
    }
    localStorage.setItem('wishlist', JSON.stringify(list));
}

function renderizarVitrine(lista, id, filtro) {
    const div = document.getElementById(id);
    if (div) {
        const filtrados = lista.filter(filtro);
        if (filtrados.length === 0) {
            div.innerHTML = '<p style="padding:40px; width:100%; text-align:center; color:#999;">Nenhum produto encontrado.</p>';
        } else {
            div.innerHTML = filtrados.map(gerarHTMLCardProduto).join('');
        }
    }
}

function ordenarProdutosGlobal(criterio) {
    if (!PRODUTOS_GLOBAIS.length) return;
    let ordenados = [...PRODUTOS_GLOBAIS];
    if (criterio === 'menor_preco') ordenados.sort((a, b) => a.preco - b.preco);
    if (criterio === 'maior_preco') ordenados.sort((a, b) => b.preco - a.preco);
    if (criterio === 'az') ordenados.sort((a, b) => a.nome.localeCompare(b.nome));
    
    for (let k in VITRINES) renderizarVitrine(ordenados, k, VITRINES[k].filter);
}

// Dropdown e UI
function toggleSortMenu() {
    const el = document.getElementById('dropdown-ordenacao');
    if(el) el.classList.toggle('active');
}
function aplicarOrdenacao(val, txt) {
    document.getElementById('sort-text').innerText = txt;
    ordenarProdutosGlobal(val);
    toggleSortMenu();
}
function rolarPara(id) {
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
}
document.addEventListener('click', e => {
    const el = document.getElementById('dropdown-ordenacao');
    if(el && !el.contains(e.target)) el.classList.remove('active');
});

// Inicialização
async function carregarProdutos() {
    try {
        // CORREÇÃO: Caminho relativo para funcionar no Railway
        const res = await fetch('/api/produtos'); 
        const dados = await res.json();
        PRODUTOS_GLOBAIS = dados;
        for (let k in VITRINES) renderizarVitrine(dados, k, VITRINES[k].filter);
    } catch(e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", carregarProdutos);

// Exporta para o escopo global (window)
window.toggleWishlist = toggleWishlist;
window.gerarHTMLCardProduto = gerarHTMLCardProduto;
window.ordenarProdutosGlobal = ordenarProdutosGlobal;
window.abrirModalProduto = abrirModalProduto;
window.toggleSortMenu = toggleSortMenu;
window.aplicarOrdenacao = aplicarOrdenacao;
window.rolarPara = rolarPara;
window.comprarDireto = comprarDireto;
window.fecharModalProduto = fecharModalProduto;