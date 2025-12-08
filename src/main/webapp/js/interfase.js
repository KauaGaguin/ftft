// ===========================
// CONSTANTES GLOBAIS
// ===========================
const API_BASE_URL = '/api';
// Usaremos 1 como ID de teste. No futuro, você deve pegar isso do localStorage após o login.
const USUARIO_ID_TESTE = 1; 
let usuarioLogado = localStorage.getItem('usuarioLogado') === 'true';
const nivelUsuario = localStorage.getItem('nivelUsuario'); // Lê o nível
// Variável global para armazenar os detalhes do último pedido criado (para a tela de resumo)
let ultimoPedidoCriado = null; 

// ==========================================================
// AÇÃO 1: FAZER O MENU HAMBÚRGUER (CATEGORIAS) FUNCIONAR
// (Sua lógica original do interfase.js)
// ==========================================================
// Nota: Seu HTML tem *dois* botões de menu. Este é o .navbar-media .menu-toggle
const toggleBtn = document.querySelector('.navbar-media .menu-toggle');
const mobilePanel = document.getElementById('categorias-panel');
const closeSubmenu = document.querySelector('.close-submenu');

if (toggleBtn && mobilePanel && closeSubmenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobilePanel.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
    
    closeSubmenu.addEventListener('click', () => {
      mobilePanel.classList.remove('show');
      document.body.style.overflow = '';
    });
    
    document.addEventListener('click', (e) => {
      const clickedOutside = !mobilePanel.contains(e.target) && !toggleBtn.contains(e.target);
      if (mobilePanel.classList.contains('show') && clickedOutside) {
        mobilePanel.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
    
    mobilePanel.addEventListener('click', (e) => e.stopPropagation());
}
// CONTROLE DO PAINEL DE CATEGORIAS UNIFICADO

function abrirCategorias() {
    const panel = document.getElementById('categorias-panel');
    
    // Cria o fundo escuro se não existir
    let overlay = document.getElementById('overlay-categorias');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-categorias';
        overlay.onclick = fecharCategorias; // Clica fora fecha
        document.body.appendChild(overlay);
    }

    if (panel) {
        panel.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // Trava rolagem
    }
}

function fecharCategorias() {
    const panel = document.getElementById('categorias-panel');
    const overlay = document.getElementById('overlay-categorias');

    if (panel) panel.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = ''; // Destrava rolagem
}
/**
 * Função para rolar suavemente até a seção da categoria
 */
function rolarPara(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        // Rola suavemente
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
/* =========================================================
   LÓGICA DO DROPDOWN CUSTOMIZADO
   ========================================================= */

// Abre e fecha o menu visualmente
function toggleSortMenu() {
    const dropdown = document.getElementById('dropdown-ordenacao');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Executa a ordenação e atualiza o texto do botão
function aplicarOrdenacao(valor, textoVisivel) {
    // 1. Atualiza o texto do botão para o escolhido (Ex: "Menor Preço")
    const textoElement = document.getElementById('sort-text');
    if (textoElement) textoElement.innerText = textoVisivel;
    
    // 2. Chama a função real de ordenar (que já criamos antes)
    ordenarProdutosGlobal(valor);
    
    // 3. Fecha o menu
    toggleSortMenu();
}

// Fecha o menu se clicar fora dele (UX Essencial)
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown-ordenacao');
    // Se o clique NÃO foi dentro do dropdown, fecha ele
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});
// ==========================================================
// AÇÃO 1.1: FAZER O MENU PRINCIPAL (ESQUERDO) FUNCIONAR (CORRIGIDO)
// ==========================================================

const menuPrincipalBtn = document.querySelector('.nav-left .menu-btn'); // O botão do canto superior esquerdo
const menuPrincipalPanel = document.getElementById('menu-panel'); // O painel lateral esquerdo
const menuPrincipalClose = document.querySelector('#menu-panel .btn-menu-close'); // O botão de fechar

function fecharMenuPrincipal() {
    if (menuPrincipalPanel) {
        // CORREÇÃO: Usa 'show' (para combinar com o CSS)
        menuPrincipalPanel.classList.remove('show');
        document.body.style.overflow = '';
    }
}

if (menuPrincipalBtn && menuPrincipalPanel && menuPrincipalClose) {
    // 1. Abrir ao clicar no botão
    menuPrincipalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // CORREÇÃO: Usa 'show' (para combinar com o CSS)
        menuPrincipalPanel.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // 2. Fechar ao clicar no botão de fechar
    menuPrincipalClose.addEventListener('click', fecharMenuPrincipal);

    // 3. Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        const isInsideMenu = menuPrincipalPanel.contains(e.target);
        const isTrigger = menuPrincipalBtn.contains(e.target);
        
        // CORREÇÃO: Checa se contém 'show'
        if (menuPrincipalPanel.classList.contains('show') && !isInsideMenu && !isTrigger) {
            fecharMenuPrincipal();
        }
    });

    // Impedir que o clique no próprio menu feche
    menuPrincipalPanel.addEventListener('click', (e) => e.stopPropagation());
}


/* ==========================================================
   FUNÇÃO CORRIGIDA: Slider com Porcentagem (Responsivo)
   ========================================================== */
function abrirMenu(tipo) {
  const menu = document.getElementById('menu-oculto');
  const slider = document.getElementById('painel-slider');
  const tabConta = document.getElementById('tab-conta');
  const tabCarrinho = document.getElementById('tab-carrinho');

  // Segurança: se não achar os elementos, para tudo
  if (!menu || !slider) return;

  // 1. Mostra o painel (traz ele da direita)
  menu.classList.add('ativo');
  
  // 2. Trava a rolagem do site atrás
  document.body.style.overflow = 'hidden';

  if (tipo === 'conta') {
    // --- MOSTRAR CONTA ---
    // Move o slider para o início (0%)
    slider.style.transform = 'translateX(0%)';
    
    // Atualiza as abas (Visual)
    if(tabConta) tabConta.classList.add('active');
    if(tabCarrinho) tabCarrinho.classList.remove('active');

    // Lógica extra: Verifica se está logado para mudar o texto (Opcional)
    atualizarEstadoConta(); 

  } else { // tipo === 'carrinho'
    // --- MOSTRAR CARRINHO ---
    // Move o slider exatamente metade para a esquerda (-50%)
    // Isso garante que o carrinho apareça inteiro, independente da largura do menu
    slider.style.transform = 'translateX(-50%)'; 
    
    // Atualiza as abas (Visual)
    if(tabCarrinho) tabCarrinho.classList.add('active');
    if(tabConta) tabConta.classList.remove('active');
  }
}

// Função auxiliar apenas para garantir que o texto da conta apareça certo
function atualizarEstadoConta() {
    const estadoConta = document.getElementById('estadoConta');
    if (estadoConta) {
        // Se precisar de lógica de login no futuro, coloque aqui
    }
}

/**
 * Fecha o painel lateral da direita
 */
function fecharMenu() {
  const menu = document.getElementById('menu-oculto');
  if (menu) {
      menu.classList.remove('ativo');
      document.body.style.overflow = '';
  }
}

// Event Listeners para os botões de fechar do painel
const cartClose = document.querySelector('.btn-cart-close');
const accountClose = document.querySelector('.btn-account-close');
if (cartClose) cartClose.addEventListener('click', fecharMenu);
if (accountClose) accountClose.addEventListener('click', fecharMenu);

// Fechar ao clicar fora (Sua lógica original)
document.addEventListener('click', function (event) {
  const menu = document.getElementById('menu-oculto');
  if (menu) { 
    const isInsideMenu = menu.contains(event.target);
    const isTrigger = event.target.closest('.cart-btn, .account-btn, .painel-tabs button');

    if (!isInsideMenu && !isTrigger) {
      fecharMenu();
    }
  }
});

// Função simples para simular cupom
function aplicarCupom() {
    const input = document.getElementById('input-cupom');
    const msg = document.getElementById('msg-cupom');
    const codigo = input.value.toUpperCase();

    if (codigo === "BEMVINDO") {
        msg.textContent = "Cupom aplicado com sucesso!";
        msg.className = "msg-feedback msg-sucesso";
        // Aqui você adicionaria a lógica real de cálculo
    } else {
        msg.textContent = "Cupom inválido.";
        msg.className = "msg-feedback msg-erro";
    }
}
const carrinhoPanel = document.getElementById('carrinho-lateral'); // ⚠️ Ajuste o ID se o seu for diferente!

function mostrarMenuCarrinho() {
    if (carrinhoPanel) {
        carrinhoPanel.classList.add('ativo'); // Ou 'show', 'open', dependendo do seu CSS
        document.body.style.overflow = 'hidden'; // Evita rolagem da página principal
    }
}

// Crie também a função para fechar, se não tiver:
function fecharMenuCarrinho() {
    if (carrinhoPanel) {
        carrinhoPanel.classList.remove('ativo');
        document.body.style.overflow = '';
    }
}
// ==========================================================
// AÇÃO 4: LÓGICA DO CAMPO DE BUSCA (Toggle Unificado)
// ==========================================================

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.getElementById('search-label');

// ... (A função filtrarProdutos deve ficar onde está) ...

// Lógica de toggle da busca (AGORA FUNCIONA EM QUALQUER RESOLUÇÃO)
if (searchBtn && searchInput) {
  let isSearchOpen = false;
  
  // 1. Abre/Fecha o campo de busca ao clicar na lupa
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Impede que o clique seja detectado pelo listener do document
    
    isSearchOpen = !isSearchOpen;
    searchInput.classList.toggle('show', isSearchOpen);
    
    // Opcional: Remove a classe 'hide' (se ela ainda estiver por aí)
    searchInput.classList.remove('hide'); 
    
    if (isSearchOpen) {
      searchInput.focus();
    } else {
      // Opcional: Limpa o filtro quando o campo é fechado
      searchInput.value = '';
      filtrarProdutos(''); 
    }
  });

  // 2. Fecha o campo de busca ao clicar em qualquer lugar FORA
  document.addEventListener('click', (e) => {
    const clickedOutside = !searchInput.contains(e.target) && !searchBtn.contains(e.target);
    
    if (isSearchOpen && clickedOutside) {
      searchInput.classList.remove('show');
      isSearchOpen = false;
    }
  });
}

// Event Listener para a busca (aplica o filtro ao digitar)
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        const termo = e.target.value.trim();
        filtrarProdutos(termo);
    });
}

// Lógica original de toggle da busca (Mantida)
// ...
// Lógica original de toggle da busca (AJUSTADA)
if (window.innerWidth <= 768) {
  let isSearchOpen = false;
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSearchOpen = !isSearchOpen;
    // Simplificado: usa apenas 'show'
    searchInput.classList.toggle('show', isSearchOpen); 
    // Remova a lógica da classe 'hide', pois é desnecessária se o CSS padrão estiver correto.
    if(isSearchOpen) searchInput.focus();
  });
  
  document.addEventListener('click', (e) => {
    const clickedOutside = !searchInput.contains(e.target) && !searchBtn.contains(e.target);
    if (isSearchOpen && clickedOutside) {
      searchInput.classList.remove('show');
      isSearchOpen = false;
    }
  });
}
// ...
// interfase.js (Adicione esta função)

/**
 * Gera o texto da mensagem com os detalhes do pedido.
 * @param {Array} itens - Lista de itens do carrinho.
 * @param {number} total - Valor total do carrinho.
 * @returns {string} Mensagem formatada.
 */
function gerarMensagemWhatsApp(itens, total) {
    let mensagem = "*NOVO PEDIDO MARIA SCENT*\n";
    mensagem += "--------------------------------------\n";
    
    itens.forEach(item => {
        const precoFormatado = parseFloat(item.preco).toFixed(2).replace('.', ',');
        mensagem += `• ${item.nome} (${item.quantidade}x) - R$ ${precoFormatado}\n`;
    });

    const totalFormatado = parseFloat(total).toFixed(2).replace('.', ',');
    mensagem += "--------------------------------------\n";
    mensagem += `*TOTAL DO PEDIDO: R$ ${totalFormatado}*\n\n`;
    mensagem += "Por favor, aguarde a confirmação de um(a) atendente para finalizar o pagamento e a entrega.";
    
    // Codifica a mensagem para uso na URL do WhatsApp
    return encodeURIComponent(mensagem);
}

// ⚠️ Se o seu `finalizarCompra` usa a URL do WhatsApp, você deve ter a constante do número:
const WHATSAPP_NUMBER = '55SEUNUMEROAQUI'; // 🚨 Substitua pelo seu número!

/**
 * Redireciona para o WhatsApp após a compra
 */
async function finalizarCompra() {
    // ... (Sua lógica de finalizar, que deve obter os itens e o total) ...
    
    // EX: Obter itens (do localStorage, onde eles foram salvos na função carregarCarrinho)
    const itens = JSON.parse(localStorage.getItem('carrinhoItens') || '[]');
    const totalElement = document.getElementById('carrinho-total'); 
    
    // EX: Se o totalElement tiver o formato 'R$ X.XX'
    const totalTexto = totalElement.textContent.replace('R$', '').replace(',', '.').trim();
    const total = parseFloat(totalTexto);


    // ... O resto da sua função ...
    const mensagem = gerarMensagemWhatsApp(itens, total); // Agora a função existe!
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${mensagem}`, '_blank');

    // ... (Limpar o carrinho, etc.)
}
// ==========================================================
// AÇÃO 5: LIMPAR CARRINHO (Função original, corrigida)
// ==========================================================

async function limparCarrinho() {
  const usuario_id = USUARIO_ID_TESTE; 
  
  try {
      // O backend [carrinho.js] espera um POST para /api/carrinho/limpar
   // No interfase.js, dentro de function limparCarrinho()

const response = await fetch(`${API_BASE_URL}/carrinho/limpar`, { 
     method: 'DELETE', // 🚨 CORREÇÃO CRÍTICA: Mudar para DELETE
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ usuario_id: usuario_id })
});
      
      if (!response.ok) throw new Error('Falha ao limpar carrinho no backend.');

      const data = await response.json(); 
      salvarNotificacao('Sucesso', data.message || 'Carrinho foi esvaziado'); 
      carregarCarrinho(); // ATUALIZA A INTERFACE
      
  } catch(error) {
      console.error("Erro ao limpar carrinho:", error);
      salvarNotificacao('Erro', 'Erro de conexão ao tentar limpar o carrinho.', 'erro');
  }
}// interfase.js (SUBSTITUA A FUNÇÃO ATUAL)
// ARQUIVO: js/interfase.js - VERSÃO CORRIGIDA E COMPLETA

async function verificarBannerAgendado() {
    const banner = document.getElementById('banner-promocional');
    const texto = document.getElementById('banner-texto');
    // NOVOS ELEMENTOS NECESSÁRIOS PARA O AJUSTE DE LAYOUT
    const menuList = document.querySelector('.menu-list');
    const corpo = document.body;
    
    if (!banner || !texto || !menuList || !corpo) return; // Garante que todos os elementos existem

    let mensagens = []; // Variável para armazenar as mensagens dos banners
    
    try {
        const response = await fetch(`${API_BASE_URL}/banner/ativo`); 
        
        if (!response.ok) throw new Error('Erro ao carregar banners da API');
        
        // CORREÇÃO: Sua API retorna um ARRAY de banners ativos
        const bannersAtivos = await response.json(); 
        
        if (bannersAtivos.length === 0) {
            banner.style.display = 'none';
            
            // GARANTE O LAYOUT BASE (SEM BANNER)
            menuList.style.top = '0'; 
            corpo.style.paddingTop = '100px'; 
            
            return;
        }

        // Mapeia os dados da API para uma lista simples de mensagens
        mensagens = bannersAtivos.map(b => b.mensagem);

    } catch (error) {
        console.error("Falha ao buscar banners agendados:", error);
        banner.style.display = 'none';
        
        // GARANTE O LAYOUT BASE (EM CASO DE ERRO)
        menuList.style.top = '0'; 
        corpo.style.paddingTop = '100px'; 
        
        return;
    }

    // --- LÓGICA DE EXIBIÇÃO E AJUSTE DE LAYOUT (ATIVA SÓ SE HÁ MENSAGENS) ---
    
    // 1. Mostra o banner 
    banner.style.display = 'block'; 
    
    // 2. Ajusta o layout dinamicamente
    // Usamos setTimeout(..., 0) para garantir que o banner seja renderizado (display: block)
    // antes de calcular sua altura correta (offsetHeight).
    setTimeout(() => {
        const alturaBanner = banner.offsetHeight; // Altura REAL do banner (ex: 40px)
        const alturaMenu = menuList.offsetHeight; // Altura do menu (ex: 100px)

        // Move o menu para baixo, abaixo do banner
        menuList.style.top = `${alturaBanner}px`;

        // Ajusta o padding-top do body para a soma: Banner + Menu
        corpo.style.paddingTop = `${alturaBanner + alturaMenu}px`;
        
    }, 0); 
    
    // 3. Lógica de Rotação (Se houver mais de uma mensagem)
    // O código abaixo é apenas um exemplo de como fazer a rotação suave.
    let index = 0;

    function alternarBannerSuave() {
        if (mensagens.length === 0) return;

        // Efeito de transição de opacidade (requer CSS)
        texto.style.opacity = '0'; 
        
        setTimeout(() => {
            texto.textContent = mensagens[index];
            index = (index + 1) % mensagens.length; 

            texto.style.opacity = '1'; 
            
            // Agenda a próxima troca
            setTimeout(alternarBannerSuave, 5000); 
            
        }, 300); // 300ms (ajuste para corresponder ao tempo de transição no seu CSS, se houver)
    }
    
    // Inicia a exibição com a primeira mensagem
    texto.textContent = mensagens[0]; 
    texto.style.opacity = '1';
    
    // Agenda a primeira troca se houver mais de uma mensagem
    if (mensagens.length > 1) {
        setTimeout(alternarBannerSuave, 5000); 
    }
}

// O resto do seu script (chamada no DOMContentLoaded) permanece igual:
// window.addEventListener("DOMContentLoaded", () => {
//   verificarBannerAgendado(); // ESTA FUNÇÃO JÁ É CHAMADA
//   // ...
// });
// ==========================================================
// AÇÃO 7: NOTIFICAÇÕES (FINALIZADA)
// ==========================================================

// Função auxiliar para exibir o toast (Seu HTML DEVE ter um elemento com id="notificacao-toast" ou adicionar o CSS para o elemento que será criado)
function showNotificationToast(mensagem, tipo = 'sucesso') {
    let toast = document.getElementById('notificacao-toast');

    // Se o elemento não existir, cria-o (e espera que o CSS o estilize)
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'notificacao-toast';
        // Estilos básicos para garantir a visualização (Recomendado usar CSS para isto)
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; 
            padding: 15px 25px; border-radius: 5px; 
            color: white; z-index: 10000; 
            font-family: sans-serif; opacity: 0; 
            transition: opacity 0.3s, background-color 0.3s;
            max-width: 300px; text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(toast);
    }
    
    // Define o estilo com base no tipo
    if (tipo === 'erro') {
        toast.style.backgroundColor = '#d9534f'; 
    } else if (tipo === 'aviso') {
        toast.style.backgroundColor = '#f0ad4e'; 
    } else { // 'sucesso' (default)
        toast.style.backgroundColor = '#5cb85c'; 
    }

    toast.textContent = mensagem;
    toast.style.opacity = '1';
    
    // Esconde após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

/**
 * Salva a notificação no backend e a exibe na interface (toast).
 * Usa o endpoint POST /api/notificacoes/nova.
 */
async function salvarNotificacao(tipo, mensagem, uiTipo = 'sucesso') {
  
  // 1. Exibe a notificação na UI imediatamente
  showNotificationToast(`${tipo}: ${mensagem}`, uiTipo);

  // 2. Tenta salvar no backend (em segundo plano)
  try {
      // O backend espera { titulo, mensagem, usuario_id }
      const response = await fetch(`${API_BASE_URL}/notificacoes/nova`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              titulo: tipo, 
              mensagem: mensagem,
              usuario_id: USUARIO_ID_TESTE 
          })
      });
      
      if (!response.ok) {
          console.warn("Falha ao salvar notificação no backend.");
      }
      
  } catch(error) {
      console.error("Erro de conexão ao tentar salvar notificação:", error);
  }
}

// ==========================================================
// AÇÃO 8: LÓGICA DE PEDIDO (FINALIZADA)
// ==========================================================

const resumoPedidoModal = document.getElementById('resumo-pedido'); // Assume um elemento modal/div

/**
 * Função principal para iniciar o processo de compra.
 * Usa o endpoint POST /api/pedido/criar.
 */
async function finalizarCompra() {
    if (!usuarioLogado) {
        salvarNotificacao('Aviso', 'Você precisa estar logado para finalizar a compra.', 'aviso');
        return;
    }

    const itensCarrinhoCompleto = JSON.parse(localStorage.getItem('carrinhoItens')) || []; 

    // 🚨 1. CORREÇÃO DE ORDEM: MAPEAR/FILTRAR PRIMEIRO
    const itensParaMensagem = itensCarrinhoCompleto.map(item => ({
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade
    }));
    
    // Vamos usar variáveis para total e ID que serão definidas dentro do try
    let total; 
    let pedidoId; 
    
    try {
        salvarNotificacao('Processando', 'Finalizando seu pedido...', 'aviso');
        
        // POST para /api/pedido/criar
        const response = await fetch(`${API_BASE_URL}/pedido/criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: USUARIO_ID_TESTE })
        });
        
        const data = await response.json();

        if (response.ok) {
            // 2. DEFINE total e pedidoId (agora que o backend retornou)
            total = data.total_pedido ? parseFloat(data.total_pedido).toFixed(2).replace('.', ',') : 'N/A';
            pedidoId = data.pedido_id;
            
            ultimoPedidoCriado = { total: total, id: pedidoId };

            // 🚨 3. CHAME gerarMensagemWhatsApp() com a assinatura correta (ITENS, TOTAL)
            // Lembre-se que sua função deve ser: gerarMensagemWhatsApp(itens, total)
            const mensagemWhatsApp = gerarMensagemWhatsApp(itensParaMensagem, total); 
            
            // 4. ATUALIZA A INTERFACE
            exibirResumoPedido(pedidoId, total, mensagemWhatsApp); 
            carregarCarrinho();
            fecharMenu();

            salvarNotificacao('Sucesso', `Pedido #${pedidoId} criado com sucesso!`, 'sucesso');
            
        } else {
            salvarNotificacao('Erro', data.message || 'Falha ao finalizar a compra. Tente novamente.', 'erro');
        }

    } catch (error) {
        console.error("Erro na requisição de finalização de compra:", error);
        salvarNotificacao('Erro', "Erro de conexão ao finalizar a compra. Verifique o backend.", 'erro');
    }
}
// Localize o bloco de código que você já tem no interfase.js que lida com os links de usuário
// (Aquele que define o texto de 'Minha Conta / Login')

// ==========================================================
// AÇÃO 3: LÓGICA DE MINHA CONTA / LOGIN / LOGOUT
// ==========================================================

const minhaContaLink = document.getElementById('minha-conta-link');
const logoutLink = document.getElementById('logout-link'); // <-- NOVO

// Função de Logout
function fazerLogout() {
    // 1. Limpa todas as chaves de login do localStorage
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('nivelUsuario');
    
    // 2. Opcional: Limpa o carrinho local
    // localStorage.removeItem('carrinho'); 

    // 3. Atualiza as variáveis globais para o novo estado
    usuarioLogado = false;
    
    // 4. Redireciona o usuário para a página inicial ou de login
    window.location.href = 'index.html'; // Ou 'login.html'
}


if (minhaContaLink && logoutLink) { // Certifique-se de que ambos os elementos existem
    
    // 1. LÓGICA DE CLIQUE DO MINHA CONTA (Você já tem, mas com ajuste)
    // ... (Mantenha sua lógica de clique aqui, que redireciona para a página correta) ...

    // 2. LÓGICA DE CLIQUE DO LOGOUT
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault(); 
        fazerLogout();
    });
    
    // 3. LÓGICA DE VISIBILIDADE E TEXTO
    if (usuarioLogado) { 
        // Se logado:
        // A. O link Minha Conta mostra o nome do usuário/painel
        // B. O link Sair aparece
        minhaContaLink.textContent = `Olá, ${localStorage.getItem('nomeUsuario') || 'Usuário'}!`;
        minhaContaLink.style.display = 'block'; // Garante que está visível
        
        logoutLink.style.display = 'block'; // Exibe o link "Sair"
    } else {
        // Se deslogado:
        // A. O link Minha Conta volta para 'Minha Conta / Login'
        // B. O link Sair fica oculto
        minhaContaLink.textContent = 'Minha Conta / Login';
        minhaContaLink.style.display = 'block'; // Garante que está visível

        logoutLink.style.display = 'none'; // Oculta o link "Sair"
    }
}
/**
 * Exibe a modal/div com o resumo do pedido (simulação de interface).
 */
/**
 * Exibe a modal/div com o resumo do pedido.
 * Agora, aceita a mensagem formatada PRONTA.
 */
function exibirResumoPedido(pedidoId, total, mensagemWhatsApp) {
    if (!resumoPedidoModal) {
        console.error("Elemento '#resumo-pedido' não encontrado no HTML.");
        return;
    }
    
    const detalhes = resumoPedidoModal.querySelector('#resumo-detalhes');
    if (detalhes) {
        detalhes.innerHTML = `
            <h2>Resumo do Pedido #${pedidoId}</h2>
            <p>Seu pedido foi processado com sucesso! Clique no botão abaixo para enviar o pedido via WhatsApp.</p>
            <p class="total-final">Total da Compra: R$ ${total}</p>
            <p>Obrigado por comprar na Maria Scent!</p>
            
            <a href="https://api.whatsapp.com/send?phone=55999999999&text=${encodeURIComponent(mensagemWhatsApp)}" 
                target="_blank" class="btn-whatsapp">
                Enviar Pedido no WhatsApp
            </a>
        `;
    }

    resumoPedidoModal.classList.add('ativo'); 
    document.body.style.overflow = 'hidden';
}


/**
 * Confirma a visualização do resumo (Ação final após a compra).
 */
function confirmarPedido() {
    salvarNotificacao('Sucesso', 'Seu pedido foi confirmado. Acompanhe a entrega!', 'sucesso');
    fecharResumo();
}

/**
 * Fecha a modal de resumo.
 */
function fecharResumo() {
    if (resumoPedidoModal) {
        resumoPedidoModal.classList.remove('ativo');
        document.body.style.overflow = '';
    }
}

/**
 * Cancela a visualização do resumo. (Apenas fecha a tela).
 */
function cancelarPedido() {
    fecharResumo();
}

// interfase.js

/**
 * Funções de navegação/filtro.
 * Esta é a função que estava faltando e causava o ReferenceError.
 */
function filtrarProdutos(categoria, linha) {
    // ⚠️ ATENÇÃO: Se esta função for usada para navegação entre páginas, use isto:
    if (categoria) {
        window.location.href = `categoria.html?nome=${categoria}`;
    }
    // Se for um filtro na tela, você deve chamar a lógica em integracao_categoria.js aqui.
}
// Adicione esta função ao final do interfase.js
function carregarCarrinho() {
    // Esta função existe apenas para evitar o erro "is not defined"
    // Coloque a lógica real do seu carrinho aqui.
    console.log("carregarCarrinho chamado. Lógica pendente de implementação.");
}

// ==========================================================
// INICIALIZAÇÃO (Ao carregar a página)
// ==========================================================
// ==========================================================
// INICIALIZAÇÃO (Ao carregar a página)
// ==========================================================
window.addEventListener("DOMContentLoaded", () => {
  // Carrega a primeira leva de produtos extras ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosExtras();
});
  // AÇÃO 6: Carregamento do banner (Sempre o primeiro a ser chamado)
  verificarBannerAgendado(); 
  
  // AÇÃO 3: Carrega o carrinho em TODAS as páginas
  carregarCarrinho();

  // AÇÃO 4: Redirecionamento Inteligente para "Minha Conta"
  const minhaContaLink = document.querySelector('.menu-hamburguer li:nth-child(4) a');
  
  // A variável 'nivelUsuario' é lida no topo do arquivo (e está segura)
  const nivel = nivelUsuario; 

  if (minhaContaLink) {
    
    // 1. LÓGICA DE CLIQUE
    minhaContaLink.addEventListener('click', (e) => {
      e.preventDefault(); 
      
      if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
      }

      // Redirecionamento baseado no nível de acesso
      switch (nivel) {
        case 'admin':
          window.location.href = 'page-adm.html';
          break;
        case 'funcionario':
          window.location.href = 'page-funcionario.html'; 
          break;
        case 'usuario':
        default:
          window.location.href = 'minha-conta.html';
          break;
      }
      
      // Lógica de fechar o menu hambúrguer, com checagem de segurança
      const mobilePanel = document.getElementById('categorias-panel');
      if (mobilePanel && mobilePanel.classList.contains('show')) {
          mobilePanel.classList.remove('show');
          document.body.style.overflow = '';
      }
    });
  
 
    // 2. LÓGICA DE TEXTO DO LINK (SEGURO CONTRA ERROS)
    // Verifica se está logado E se o nível não é nulo/vazio
    if (usuarioLogado && nivel) { 
        // Formata o texto: Admin, Funcionario, Usuario
        const nivelFormatado = nivel.charAt(0).toUpperCase() + nivel.slice(1);
        minhaContaLink.textContent = `Minha Conta (${nivelFormatado})`;
    }
  }

}); // FIM DO DOMContentLoaded (Agora fechando corretamente)