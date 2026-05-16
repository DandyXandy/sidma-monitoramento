document.addEventListener("DOMContentLoaded", () => {
    
    // ================= 1. MENU ATIVO CONFORME O SCROLL =================
    const navbarLinks = document.querySelectorAll(".navbar a:not(.nav-btn)");
    const sections = document.querySelectorAll("section");

    function activateMenuOnScroll() {
        let currentSectionId = "";
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Detecta se a seção passou da metade superior da tela
            if (window.scrollY >= sectionTop - 200) {
                currentSectionId = section.getAttribute("id");
            }
        });

        navbarLinks.forEach(link => {
            link.classList.remove("active");
            if (currentSectionId && link.getAttribute("href").includes(currentSectionId)) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", activateMenuOnScroll);


    // ================= 2. ANIMAÇÃO SUAVE AO ROLAR A PÁGINA (SCROLL REVEAL) =================
    // Mapeia as classes do HTML para as propriedades de animação que adicionaremos dinamicamente
    const animationStyles = {
        'fade-up': { transform: 'translateY(40px)', opacity: '0' },
        'fade-left': { transform: 'translateX(-50px)', opacity: '0' },
        'fade-right': { transform: 'translateX(50px)', opacity: '0' },
        'fade-in': { opacity: '0' }
    };

    // Seleciona todos os elementos que possuem classes de animação na index
    const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .fade-in');

    // Prepara os elementos escondendo-os antes da rolagem começar
    animatedElements.forEach(element => {
        element.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
        
        // Aplica o estado inicial correto baseado na classe que o elemento tem
        for (const [className, styles] of Object.entries(animationStyles)) {
            if (element.classList.contains(className)) {
                Object.assign(element.style, styles);
            }
        }
    });

    // Configura o observador de interseção (Intersection Observer API)
    const appearanceObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Quando o elemento entra 10% na área visível da tela
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // Torna o elemento visível e remove os descolamentos
                target.style.opacity = '1';
                target.style.transform = 'translate(0, 0)';
                
                // Remove o elemento do observador para melhorar a performance (só anima uma vez)
                observer.unobserve(target);
            }
        });
    }, {
        root: null, // Usa o viewport do navegador
        threshold: 0.10 // Dispara quando 10% do elemento aparece
    });

    // Ativa o observador para cada elemento animável
    animatedElements.forEach(element => appearanceObserver.observe(element));


    // ================= 3. EFEITO GLASSMORPHISM DINÂMICO NO MENU OTIMIZADO =================
    const header = document.querySelector(".header");
    
    function toggleHeaderBackground() {
        if (window.scrollY > 50) {
            header.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
            header.style.background = "rgba(10, 12, 10, 0.9)";
        } else {
            header.style.boxShadow = "none";
            header.style.background = "rgba(10, 12, 10, 0.75)";
        }
    }

    window.addEventListener("scroll", toggleHeaderBackground);
    
    // Executa uma vez no início caso a página recarregue no meio do scroll
    toggleHeaderBackground();
    activateMenuOnScroll();
});


// ================= 4. SISTEMA GLOBAL DE NOTIFICAÇÕES (TOAST) =================
/**
 * Dispara um alerta visual premium na parte inferior direita da tela.
 * @param {string} message - O texto informativo que será exibido.
 */
function triggerNotice(message) {
    const toast = document.getElementById("globalToast");
    const toastMsg = document.getElementById("toastMessage");
    
    if (!toast || !toastMsg) return;

    // Atualiza a mensagem e exibe o toast
    toastMsg.textContent = message;
    toast.classList.add("show");

    // Remove automaticamente após 4 segundos
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// ==================================================================
// JS DA PARTE DE DENUNCIAS, Caso for usar o php, é melhor combinar com o backend, 
// CONTROLADORES DA TELA DE DENÚNCIA (DADOS DINÂMICOS, GPS E PREVIEW)
// ==========================================================================
// Variáveis Globais de Controle do Mapa
let map;
let marker;
let damageCircle;
let selectedCoordinates = null;

// Função chamada automaticamente pela API do Google Maps carregada no HTML
function initMap() {
    // Coordenadas padrão inicial (Centro do Brasil / Amazônia caso o GPS falhe)
    const defaultLocation = { lat: -3.119027, lng: -60.021731 }; 

    // Configuração visual Dark Mode para o Google Maps se integrar ao visual do site
    const darkMapStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#121512" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#747a74" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121512" }] },
        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c332c" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1c221c" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#070a07" }] }
    ];

    // Instancia o Mapa dentro do container da Modal
    map = new google.maps.Map(document.getElementById("googleMapContainer"), {
        center: defaultLocation,
        zoom: 14,
        styles: darkMapStyle,
        disableDefaultUI: true,
        zoomControl: true
    });

    // Instancia o Marcador arrastável (Pin)
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,
        title: "Foco da Ocorrência"
    });

    // Instancia o Círculo de Monitoramento (Estilo Radar)
    damageCircle = new google.maps.Circle({
        map: map,
        radius: 100, // Raio inicial em metros
        fillColor: "#00e676",
        fillOpacity: 0.15,
        strokeColor: "#00e676",
        strokeOpacity: 0.5,
        strokeWeight: 1
    });

    // Vincula o círculo ao marcador (O círculo anda junto com o Pin)
    damageCircle.bindTo("center", marker, "position");

    // Evento para capturar coordenadas quando terminar de arrastar o Pin
    google.maps.event.addListener(marker, 'dragend', function() {
        selectedCoordinates = marker.getPosition();
    });
}

// Execução de binds dos componentes de tela
if (document.getElementById("formDenunciaAmbiental")) {
    
    const optAnonimo = document.getElementById("optAnonimo");
    const optIdentificado = document.getElementById("optIdentificado");
    const dadosIdentificacao = document.getElementById("dadosIdentificacao");
    const campoNome = document.getElementById("nomeCompleto");
    const campoCpf = document.getElementById("cpfUsuario");

    // Controle de Privacidade (Anônimo/Identificado)
    optAnonimo.addEventListener("click", () => {
        optAnonimo.classList.add("active");
        optIdentificado.classList.remove("active");
        dadosIdentificacao.classList.add("hidden");
        campoNome.required = false; campoCpf.required = false;
        campoNome.value = ""; campoCpf.value = "";
    });

    optIdentificado.addEventListener("click", () => {
        optIdentificado.classList.add("active");
        optAnonimo.classList.remove("active");
        dadosIdentificacao.classList.remove("hidden");
        campoNome.required = true; campoCpf.required = true;
    });

    // Máscara de CPF
    campoCpf.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
    });

    // CONTROLES DO MODAL DO MAPA
    const btnOpenMaps = document.getElementById("btnGpsSmart");
    const inputLocalizacao = document.getElementById("localizacaoOcorrencia");
    const mapsModal = document.getElementById("mapsModal");
    const btnCloseMaps = document.getElementById("btnCloseMaps");
    const btnConfirmarLocal = document.getElementById("btnConfirmarLocal");
    const radiusSlider = document.getElementById("radiusSlider");
    const radiusVal = document.getElementById("radiusVal");

    // Gatilho para Abrir o Mapa Interativo
    btnOpenMaps.addEventListener("click", () => {
        mapsModal.classList.remove("hidden");
        
        // Tenta centralizar o Google Maps na posição real do usuário usando o GPS nativo antes dele arrastar
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLoc);
                marker.setPosition(userLoc);
                selectedCoordinates = marker.getPosition();
            });
        }
    });

    // Fechar Modal sem Salvar
    btnCloseMaps.addEventListener("click", () => mapsModal.classList.add("hidden"));

    // Atualização do Raio em Tempo Real ao arrastar o Slider
    radiusSlider.addEventListener("input", (e) => {
        const radiusInMeters = parseInt(e.target.value);
        radiusVal.textContent = radiusInMeters;
        if (damageCircle) {
            damageCircle.setRadius(radiusInMeters);
        }
    });

    // Confirmar Escolha de Posição do Mapa
    btnConfirmarLocal.addEventListener("click", () => {
        const coords = selectedCoordinates || marker.getPosition();
        const lat = coords.lat().toFixed(6);
        const lng = coords.lng().toFixed(6);
        const raio = radiusSlider.value;

        // Injeta a string tratada direto no input visível do formulário
        inputLocalizacao.value = `Lat: ${lat}, Lng: ${lng} (Raio: ${raio}m)`;
        
        mapsModal.classList.add("hidden");
        triggerNotice("Área demarcada com sucesso no satélite.");
    });

    // Controle de Upload de Imagem de Evidência
    const arquivoEvidencia = document.getElementById("arquivoEvidencia");
    const textoUpload = document.getElementById("textoUpload");
    const containerPreview = document.getElementById("containerPreview");
    const imgPreview = document.getElementById("imgPreview");

    arquivoEvidencia.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            textoUpload.textContent = `Evidência: ${file.name}`;
            const reader = new FileReader();
            reader.onload = function(event) {
                imgPreview.src = event.target.result;
                containerPreview.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
            triggerNotice("Foto carregada com sucesso.");
        }
    });

    // Envio Final do Formulário
    document.getElementById("formDenunciaAmbiental").addEventListener("submit", (e) => {
        e.preventDefault();
        triggerNotice("Enviando pacote de dados criptografados...");
        
        setTimeout(() => {
            triggerNotice("Sucesso! Registro inserido na fila de fiscalização.");
            document.getElementById("formDenunciaAmbiental").reset();
            containerPreview.classList.add("hidden");
            textoUpload.textContent = "Clique para carregar foto da evidência";
            optAnonimo.click();
        }, 2000);
    });
}

// ==========================================================================
// CONTROLADORES DA TELA DE LOGIN ADMINISTRATIVO
// ==========================================================================
if (document.getElementById("formLoginAdm")) {
    
    const campoSenha = document.getElementById("loginPassword");
    const btnTogglePassword = document.getElementById("btnTogglePassword");
    const formLogin = document.getElementById("formLoginAdm");
    const btnEsqueci = document.getElementById("btnEsqueciSenha");

    // Lógica de Mostrar / Esconder Senha Dinamicamente
    btnTogglePassword.addEventListener("click", () => {
        // Alterna o tipo do input
        const isPassword = campoSenha.getAttribute("type") === "password";
        campoSenha.setAttribute("type", isPassword ? "text" : "password");
        
        // Alterna graficamente o ícone do olho
        btnTogglePassword.innerHTML = isPassword 
            ? '<i class="fas fa-eye-slash"></i>' 
            : '<i class="fas fa-eye"></i>';
            
        // Altera a cor de foco do botão
        btnTogglePassword.style.color = isPassword ? "#00e676" : "#8a8f8a";
    });

    // Link simulado de Recuperação de Senha
    btnEsqueci.addEventListener("click", (e) => {
        e.preventDefault();
        triggerNotice("Contate o administrador do STI para redefinir sua credencial.");
    });

    // Evento de Submit para validação no Backend futuro
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById("loginUser").value.trim();
        
        triggerNotice("Validando assinatura digital...");
        
        setTimeout(() => {
            // Simulação simples apenas de interface
            triggerNotice(`Bem-vindo de volta, operador ${usuario}!`);
            
            // Aqui futuramente o backend redirecionará usando window.location.href
        }, 1500);
    });
}