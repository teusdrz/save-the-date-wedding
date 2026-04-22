// ===== CONFIGURAÇÃO E CONSTANTES =====
const CONFIG = {
    formData: [],
    storageKey: 'saveTheDate_rsvp',
    timerKey: 'saveTheDate_firstVisit',
    userIdentityKey: 'saveTheDate_userIdentity',
    oneWeekInMs: 7 * 24 * 60 * 60 * 1000, // 1 semana em milissegundos
    collections: {
        guests: "guests",
        payments: "payments",
        rsvp: "rsvp",
        settings: "settings"
    }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEntranceAnimation();
    initializeTimer();
    initializeForm();
    initializeGuestFilter();
    initializeModal();
    initializeCarousel();
    initializeSmoothScroll();
    initializeIntersectionObserver();
    initializeMusicPlayer();
    loadSavedData();
});

// ===== ANIMAÇÃO DE ENTRADA COM GSAP =====
// Conceito: Minimalismo absoluto - apenas letras com movimentos sutis
// Animação ocorre APENAS na primeira visita ao site
function initializeEntranceAnimation() {
    const FIRST_VISIT_KEY = 'saveTheDate_hasSeenIntro';
    const hasSeenIntro = localStorage.getItem(FIRST_VISIT_KEY);

    // Se já viu a intro, ocultar imediatamente
    if (hasSeenIntro === 'true') {
        const overlay = document.querySelector('.entrance-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        return; // Não executar animação
    }

    // Marcar que o usuário já viu a intro
    localStorage.setItem(FIRST_VISIT_KEY, 'true');

    // Timeline minimalista e elegante
    const tl = gsap.timeline({
        defaults: {
            ease: "power3.out",
            duration: 1.5
        }
    });

    // Configuração inicial
    gsap.set('.entrance-content', {
        opacity: 0
    });

    gsap.set('.monogram-letter', {
        opacity: 0,
        y: 40,
        scale: 0.9
    });

    gsap.set('.monogram-ampersand', {
        opacity: 0,
        scale: 0.7
    });

    // Breathing effect no fundo (ultra sutil)
    gsap.to('.entrance-overlay::before', {
        opacity: 0.015,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // Sequência minimalista da animação
    tl
        // 1. Container fade in
        .to('.entrance-content', {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
        })

        // 2. Letra M aparece suavemente
        .to('.monogram-m', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.8,
            ease: "power4.out"
        }, "+=0.5")

        // 3. Ampersand com movimento delicado
        .to('.monogram-ampersand', {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: "back.out(1.2)"
        }, "-=1.2")

        // 4. Letra F completa o monograma
        .to('.monogram-f', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.8,
            ease: "power4.out"
        }, "-=1.4")

        // 5. Glow sutil e elegante nas letras
        .to(['.monogram-m', '.monogram-f'], {
            textShadow: "0 0 40px rgba(255, 255, 255, 0.15)",
            duration: 2,
            repeat: 1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.3
        }, "+=0.8")

        // 6. Ampersand também recebe glow
        .to('.monogram-ampersand', {
            textShadow: "0 0 25px rgba(255, 255, 255, 0.12)",
            duration: 2,
            repeat: 1,
            yoyo: true,
            ease: "sine.inOut"
        }, "<")

        // 7. Pausa contemplativa
        .to({}, { duration: 1 })

        // 8. Fade out minimalista e sutil
        // As letras se dissolvem individualmente
        .to('.monogram-m', {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 1.5,
            ease: "power2.in"
        })
        .to('.monogram-f', {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 1.5,
            ease: "power2.in"
        }, "-=1.3")
        .to('.monogram-ampersand', {
            opacity: 0,
            scale: 0.8,
            duration: 1.2,
            ease: "power2.in"
        }, "-=1.4")

        // 9. O fundo desaparece suavemente por último
        .to('.entrance-overlay', {
            opacity: 0,
            duration: 1.8,
            ease: "power2.inOut",
            onComplete: () => {
                document.querySelector('.entrance-overlay').style.display = 'none';
            }
        }, "-=0.5");

    // Parallax ultra sutil no mouse (apenas desktop)
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            const overlay = document.querySelector('.entrance-overlay');
            if (!overlay || overlay.style.display === 'none') return;

            const moveX = (e.clientX - window.innerWidth / 2) * 0.005;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.005;

            gsap.to('.entrance-monogram', {
                x: moveX,
                y: moveY,
                duration: 1.2,
                ease: "power2.out"
            });
        });
    }
}

// ===== SISTEMA DE CRONÔMETRO =====
async function initializeTimer() {
    // Verificar se o admin resetou o timer
    await checkTimerReset();

    // Verificar se já existe um registro de primeira visita
    let firstVisit = localStorage.getItem(CONFIG.timerKey);

    if (!firstVisit) {
        // Primeira visita - registrar timestamp atual
        firstVisit = new Date().getTime();
        localStorage.setItem(CONFIG.timerKey, firstVisit);
    } else {
        firstVisit = parseInt(firstVisit);
    }

    // Iniciar atualização do cronômetro
    updateTimer(firstVisit);

    // Atualizar a cada segundo
    setInterval(() => updateTimer(firstVisit), 1000);
}

// Verificar se o admin resetou o timer
async function checkTimerReset() {
    try {
        if (!db) return; // Firebase não disponível

        const timerControlDoc = await db.collection(CONFIG.collections.settings).doc('timerControl').get();

        if (timerControlDoc.exists) {
            const data = timerControlDoc.data();

            if (data.shouldReset) {
                // Admin resetou o timer - limpar localStorage
                localStorage.removeItem(CONFIG.timerKey);
                console.log('Timer resetado pelo administrador');

                // Limpar flag no Firebase (para não resetar novamente)
                await db.collection(CONFIG.collections.settings).doc('timerControl').update({
                    shouldReset: false,
                    lastProcessed: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.warn('Não foi possível verificar reset do timer:', error);
    }
}

function updateTimer(firstVisit) {
    const now = new Date().getTime();
    const deadline = firstVisit + CONFIG.oneWeekInMs;
    const timeLeft = deadline - now;

    if (timeLeft <= 0) {
        // Tempo expirado - bloquear formulário
        handleTimerExpired();
        return;
    }

    // Calcular tempo restante
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Atualizar display
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    // Adicionar animação de urgência nos últimos 24 horas
    const timerDisplay = document.querySelector('.timer-display');
    if (timeLeft <= 24 * 60 * 60 * 1000 && timerDisplay) {
        timerDisplay.classList.add('timer-urgent');
    }
}

function handleTimerExpired() {
    // Esconder cronômetro
    const timerEl = document.getElementById('confirmationTimer');
    if (timerEl) {
        timerEl.style.display = 'none';
    }

    // Esconder formulário
    const form = document.getElementById('rsvpForm');
    if (form) {
        form.style.display = 'none';
    }

    // Esconder aviso importante
    const notice = document.querySelector('.rsvp-important-notice');
    if (notice) {
        notice.style.display = 'none';
    }

    // Mostrar mensagem de expiração
    const expiredMsg = document.getElementById('expiredMessage');
    if (expiredMsg) {
        expiredMsg.style.display = 'flex';
    }

    // Parar todas as atualizações do cronômetro
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = '00';
    if (hoursEl) hoursEl.textContent = '00';
    if (minutesEl) minutesEl.textContent = '00';
    if (secondsEl) secondsEl.textContent = '00';
}

// ===== FORMULÁRIO RSVP =====
function initializeForm() {
    const form = document.getElementById('rsvpForm');

    // Submissão do formulário
    form.addEventListener('submit', handleFormSubmit);
}

// ===== FILTRO DE CONVIDADOS =====
function initializeGuestFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const guestSelect = document.getElementById('guestName');
    const optgroups = guestSelect.querySelectorAll('optgroup');

    // Criar um objeto para armazenar todas as opções
    const allOptions = {
        all: [],
        convidados: [],
        familia: [],
        madrinhas: [],
        padrinhos: []
    };

    // Coletar todas as opções por categoria
    optgroups.forEach(optgroup => {
        const category = optgroup.getAttribute('data-category');
        const options = Array.from(optgroup.querySelectorAll('option'));

        allOptions[category] = options.map(opt => ({
            value: opt.value,
            text: opt.text,
            label: optgroup.label
        }));

        allOptions.all = allOptions.all.concat(allOptions[category]);
    });

    // Adicionar evento de clique nos botões
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            // Remover classe active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Adicionar classe active ao botão clicado
            button.classList.add('active');

            // Resetar o select
            guestSelect.value = '';

            // Limpar o select (manter apenas a opção padrão)
            while (guestSelect.options.length > 1) {
                guestSelect.remove(1);
            }

            // Adicionar as opções filtradas
            if (filter === 'all') {
                // Recriar todos os optgroups
                optgroups.forEach(optgroup => {
                    const newOptgroup = document.createElement('optgroup');
                    newOptgroup.label = optgroup.label;
                    newOptgroup.setAttribute('data-category', optgroup.getAttribute('data-category'));

                    const category = optgroup.getAttribute('data-category');
                    allOptions[category].forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.text = opt.text;
                        newOptgroup.appendChild(option);
                    });

                    guestSelect.appendChild(newOptgroup);
                });
            } else {
                // Criar apenas o optgroup filtrado
                const filteredOptions = allOptions[filter];
                if (filteredOptions && filteredOptions.length > 0) {
                    const newOptgroup = document.createElement('optgroup');
                    newOptgroup.label = filteredOptions[0].label;
                    newOptgroup.setAttribute('data-category', filter);

                    filteredOptions.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.text = opt.text;
                        newOptgroup.appendChild(option);
                    });

                    guestSelect.appendChild(newOptgroup);
                }
            }
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();

    // Verificar se o prazo expirou
    const firstVisit = parseInt(localStorage.getItem(CONFIG.timerKey));
    const now = new Date().getTime();
    const deadline = firstVisit + CONFIG.oneWeekInMs;

    if (now >= deadline) {
        handleTimerExpired();
        showNotification('O prazo para confirmação foi encerrado.', 'error');
        return;
    }

    const guestNameSelect = document.getElementById('guestName');
    const attendanceRadio = document.querySelector('input[name="attendance"]:checked');

    // Validação
    if (!guestNameSelect.value) {
        showNotification('Por favor, selecione seu nome.', 'error');
        return;
    }

    if (!attendanceRadio) {
        showNotification('Por favor, confirme sua presença.', 'error');
        return;
    }

    // Se confirmou presença, abrir modal para nome completo
    if (attendanceRadio.value === 'yes') {
        const guestLabel = guestNameSelect.selectedOptions[0].text;
        openFullNameModal(guestLabel);
    } else {
        // Se não confirmou, enviar direto para WhatsApp
        const guestLabel = guestNameSelect.selectedOptions[0].text;
        const message = document.getElementById('message').value;
        sendToWhatsApp(guestLabel, '', 'no', message);
    }
}

// ===== MODAL NOME COMPLETO =====
function openFullNameModal(guestName) {
    const modal = document.getElementById('fullNameModal');
    const fullNameInput = document.getElementById('fullName');

    // Preencher com o nome selecionado
    fullNameInput.value = guestName;

    // Mostrar modal
    modal.classList.add('show');

    // Focar no input
    setTimeout(() => fullNameInput.focus(), 100);
}

function closeFullNameModal() {
    const modal = document.getElementById('fullNameModal');
    modal.classList.remove('show');
    document.getElementById('fullName').value = '';
}

// ===== WHATSAPP E FIREBASE =====
async function sendToWhatsApp(guestName, fullName, attendance, message = '') {
    const phoneNumber = '5511932049040'; // Seu WhatsApp

    let whatsappMessage = '';

    if (attendance === 'yes') {
        whatsappMessage = `Ola! Eu, *${fullName}*, confirmo minha presenca nesse grande dia!`;

        if (message.trim()) {
            whatsappMessage += `\n\n_Mensagem:_ ${message}`;
        }
    } else {
        whatsappMessage = `Ola! Infelizmente *${guestName}* nao podera comparecer ao casamento.`;

        if (message.trim()) {
            whatsappMessage += `\n\n_Mensagem:_ ${message}`;
        }
    }

    // Salvar RSVP no Firebase ANTES de enviar para WhatsApp
    try {
        await saveRSVP({
            guestName: guestName,
            fullName: fullName || guestName,
            attendance: attendance,
            message: message,
            status: attendance === 'yes' ? 'confirmed' : 'declined',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao salvar RSVP:', error);
    }

    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // Criar URL do WhatsApp
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Redirecionar para WhatsApp
    window.open(whatsappURL, '_blank');

    // Fechar modal se estiver aberto
    closeFullNameModal();

    // Mostrar mensagem de sucesso
    showSuccessMessage();

    // Limpar formulário após 2 segundos
    setTimeout(() => {
        document.getElementById('rsvpForm').reset();
    }, 2000);
}

// Inicializar modal
function initializeModal() {
    const modal = document.getElementById('fullNameModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const confirmBtn = document.getElementById('confirmWhatsApp');
    const fullNameInput = document.getElementById('fullName');

    // Fechar modal ao clicar no X
    closeBtn.addEventListener('click', closeFullNameModal);

    // Fechar modal ao clicar em Cancelar
    cancelBtn.addEventListener('click', closeFullNameModal);

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFullNameModal();
        }
    });

    // Confirmar e enviar para WhatsApp
    confirmBtn.addEventListener('click', () => {
        const fullName = fullNameInput.value.trim();

        if (!fullName) {
            alert('Por favor, digite seu nome completo.');
            fullNameInput.focus();
            return;
        }

        const guestNameSelect = document.getElementById('guestName');
        const guestLabel = guestNameSelect.selectedOptions[0].text;
        const message = document.getElementById('message').value;

        sendToWhatsApp(guestLabel, fullName, 'yes', message);
    });

    // Permitir Enter para confirmar
    fullNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
}

async function saveRSVP(data) {
    try {
        // Verificar se Firebase está disponível
        if (!db) {
            console.warn('Firebase nao disponivel. Salvando apenas localmente.');
            saveRSVPLocally(data);
            return;
        }

        // Gerar ID único para o convidado
        const guestId = data.guestName.toLowerCase().replace(/\s+/g, '-');

        // Salvar no Firebase
        await db.collection(CONFIG.collections.rsvp).doc(guestId).set({
            guestName: data.guestName,
            fullName: data.fullName,
            attendance: data.attendance,
            status: data.status,
            message: data.message || '',
            email: data.email || '',
            phone: data.phone || '',
            companions: data.companions || 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('RSVP salvo no Firebase com sucesso:', guestId);

        // Também salvar localmente como backup
        saveRSVPLocally(data);

    } catch (error) {
        console.error('Erro ao salvar RSVP no Firebase:', error);
        // Fallback para localStorage
        saveRSVPLocally(data);
    }
}

function saveRSVPLocally(data) {
    // Obter dados existentes
    let savedData = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];

    // Verificar se o convidado já confirmou
    const existingIndex = savedData.findIndex(item => item.guestName === data.guestName);

    if (existingIndex !== -1) {
        // Atualizar confirmação existente
        savedData[existingIndex] = data;
    } else {
        // Adicionar nova confirmação
        savedData.push(data);
    }

    // Salvar no localStorage
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(savedData));
    console.log('RSVP salvo localmente');
}

function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
    console.log('Confirmações salvas:', savedData);
    // Aqui você pode implementar lógica para pré-preencher o formulário se necessário
}

function showSuccessMessage() {
    const form = document.getElementById('rsvpForm');
    const successMessage = document.getElementById('successMessage');

    form.style.opacity = '0';
    form.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        form.style.display = 'none';
        successMessage.style.display = 'block';

        setTimeout(() => {
            successMessage.style.opacity = '1';
            successMessage.style.transform = 'translateY(0)';
        }, 10);
    }, 400);
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Adicionar estilos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        padding: '1rem 2rem',
        background: type === 'error' ? '#DC2626' : '#059669',
        color: 'white',
        borderRadius: '4px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// ===== CARROSSEL =====
function initializeCarousel() {
    const track = document.querySelector('.carousel-track');

    if (!track) return;

    // O carrossel agora rola infinitamente sem parar
    // Removido o pause ao passar o mouse para manter rolagem contínua

    // Adicionar gesture para mobile (opcional - visualização)
    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        isDragging = true;
    });

    track.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== SCROLL SUAVE =====
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== INTERSECTION OBSERVER (Animações ao scroll) =====
function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos que devem animar
    const animatedElements = document.querySelectorAll('.detail-card, .rsvp-container');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    // Observer especial para os blocos da história com animação de entrada/saída
    const storyObserverOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const storyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Aparece quando entra na tela
                entry.target.classList.add('animate-in');
            } else {
                // Desaparece quando sai da tela (ao subir ou descer)
                entry.target.classList.remove('animate-in');
            }
        });
    }, storyObserverOptions);

    // Observar blocos da história
    const storyBlocks = document.querySelectorAll('[data-animate]');
    storyBlocks.forEach(block => {
        storyObserver.observe(block);
    });
}

// ===== UTILITÁRIOS =====

// Formatar data
function formatDate(dateString) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Validar email (caso adicione campo de email)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Sanitizar input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// ===== PERFORMANCE =====

// Debounce para eventos frequentes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== EXPORTAR DADOS (para os noivos) =====
function exportRSVPData() {
    const data = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `rsvp-confirmacoes-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Tornar função disponível globalmente (para botão de admin, se necessário)
window.exportRSVPData = exportRSVPData;

// ===== CONSOLE LOGS PARA DESENVOLVIMENTO =====
console.log('%cSave the Date - Landing Page', 'color: #0A1929; font-size: 24px; font-weight: bold;');
console.log('%cDesenvolvido com ❤️', 'color: #0A1929; font-size: 14px;');
console.log('%cPara exportar confirmações, use: exportRSVPData()', 'color: #666; font-size: 12px;');

// ===== SEGURANÇA E VALIDAÇÃO =====

// Prevenir ataques XSS
const escapeHtml = (text) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
};

// Limitar tamanho de mensagem
document.getElementById('message')?.addEventListener('input', function () {
    const maxLength = 500;
    if (this.value.length > maxLength) {
        this.value = this.value.substring(0, maxLength);
        showNotification(`Mensagem limitada a ${maxLength} caracteres.`, 'info');
    }
});

// ===== COMPATIBILIDADE COM NAVEGADORES ANTIGOS =====
if (!window.IntersectionObserver) {
    // Fallback para navegadores sem suporte
    document.querySelectorAll('.detail-card, .rsvp-container').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
}

// ===== DRESS CODE - MOBILE TOUCH SUPPORT =====
// Adicionar suporte para toque em mobile - mostrar nome da cor ao tocar
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', function (e) {
        // Detectar se é dispositivo móvel
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (isMobile) {
            e.preventDefault();

            // Remover classe active de todos os outros swatches
            document.querySelectorAll('.color-swatch').forEach(s => {
                if (s !== this) {
                    s.classList.remove('active');
                }
            });

            // Toggle da classe active no swatch clicado
            this.classList.toggle('active');

            // Remover a classe active após 3 segundos
            setTimeout(() => {
                this.classList.remove('active');
            }, 3000);
        }
    });
});

// ===== PLAYER DE MÚSICA =====
function initializeMusicPlayer() {
    const musicButton = document.getElementById('musicButton');
    const audio = document.getElementById('backgroundMusic');
    const playIcon = document.querySelector('.music-play');
    const pauseIcon = document.querySelector('.music-pause');

    let isPlaying = false;
    let userHasInteracted = false;

    // Função para iniciar a música com som
    const startMusicWithSound = () => {
        audio.muted = false; // Desmutar
        audio.play()
            .then(() => {
                musicButton.classList.add('playing');
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                isPlaying = true;
                console.log('Música iniciada com sucesso!');
            })
            .catch(error => {
                console.log('Erro ao iniciar música:', error);
            });
    };

    // Iniciar música mutada imediatamente (permitido pelos navegadores)
    audio.muted = true;
    audio.play()
        .then(() => {
            console.log('Música iniciada (mutada)');
            isPlaying = true;
            // Mostrar ícone de pause desde o início
            musicButton.classList.add('playing');
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        })
        .catch(error => {
            console.log('Erro ao iniciar música mutada:', error);
        });

    // Desmutar na primeira interação do usuário
    const handleFirstInteraction = () => {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (isPlaying && audio.muted) {
                audio.muted = false;
                musicButton.classList.add('playing');
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                console.log('Música desmutada após interação do usuário!');
            }
        }
    };

    // Adicionar listeners para primeira interação
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    // Controle manual do botão
    musicButton.addEventListener('click', (e) => {
        e.stopPropagation();

        if (isPlaying) {
            // Pausar música
            audio.pause();
            musicButton.classList.remove('playing');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            isPlaying = false;
        } else {
            // Retomar música
            audio.muted = false;
            audio.play()
                .then(() => {
                    musicButton.classList.add('playing');
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'block';
                    isPlaying = true;
                })
                .catch(error => {
                    console.log('Erro ao reproduzir áudio:', error);
                    showNotification('Não foi possível reproduzir a música. Por favor, tente novamente.', 'error');
                });
        }
    });

    // Adicionar efeito visual quando a música termina (caso não seja loop)
    audio.addEventListener('ended', () => {
        musicButton.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        isPlaying = false;
    });

    // Tratar erros de carregamento de áudio
    audio.addEventListener('error', (e) => {
        console.error('Erro ao carregar áudio:', e);
        musicButton.style.display = 'none'; // Esconder botão se não conseguir carregar
    });
}

// ===== LISTA DE PRESENTES / PIX =====
// Metas de cada finalidade (em reais)
const PURPOSE_GOALS = {
    'lua-de-mel': 5000,
    'casamento': 5000,
    'imoveis': 5000,
    'geladeira': 2000,
    'sofa': 3000,
    'fogao': 1500,
    'televisao': 2500
};

let selectedPurpose = 'lua-de-mel'; // Finalidade selecionada atualmente

function openPixModal() {
    const modal = document.getElementById('pixModal');
    modal.classList.add('show');
    initializePurposeSelector();
    loadProgressData();

    // Configurar atualizações em tempo real (Firebase)
    if (typeof setupRealtimeUpdates === 'function') {
        setupRealtimeUpdates();
    }
}

// Inicializar seletor de finalidade do PIX
function initializePurposeSelector() {
    const purposeBtns = document.querySelectorAll('.purpose-btn');
    const selectedPurposeText = document.getElementById('selectedPurpose');

    purposeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active de todos os botões
            purposeBtns.forEach(b => b.classList.remove('active'));

            // Adiciona active ao botão clicado
            this.classList.add('active');

            // Atualiza o texto da finalidade selecionada
            const purpose = this.textContent.trim();
            selectedPurposeText.textContent = purpose;

            // Salva a finalidade selecionada
            selectedPurpose = this.getAttribute('data-purpose');

            // Log da escolha
            console.log('Finalidade selecionada:', selectedPurpose);
        });
    });
}

// Carregar dados de progresso (Firebase ou LocalStorage)
async function loadProgressData() {
    try {
        const progressData = await loadFromDatabase();

        Object.keys(PURPOSE_GOALS).forEach(purpose => {
            const currentValue = progressData[purpose] || 0;
            const goal = PURPOSE_GOALS[purpose];
            const percentage = Math.min((currentValue / goal) * 100, 100);

            updateProgressBar(purpose, currentValue, goal, percentage);
        });
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
    }
}

// Atualizar barra de progresso visual
function updateProgressBar(purpose, currentValue, goal, percentage) {
    const progressItem = document.querySelector(`.progress-item[data-purpose="${purpose}"]`);

    if (!progressItem) return;

    const progressFill = progressItem.querySelector('.progress-fill');
    const progressPercent = progressItem.querySelector('.progress-percent');
    const purposeBtn = document.querySelector(`.purpose-btn[data-purpose="${purpose}"]`);

    // Atualizar apenas a porcentagem
    progressFill.style.width = `${percentage}%`;
    progressPercent.textContent = `${Math.round(percentage)}%`;

    // Se completou 100%, marcar como completo e desabilitar botão
    if (percentage >= 100) {
        progressItem.classList.add('completed');
        if (purposeBtn && !purposeBtn.querySelector('.completed-mark')) {
            purposeBtn.style.opacity = '0.5';
            purposeBtn.style.pointerEvents = 'none';
            const mark = document.createElement('span');
            mark.className = 'completed-mark';
            mark.textContent = ' ✓';
            purposeBtn.appendChild(mark);
        }
    }
}

function closePixModal() {
    const modal = document.getElementById('pixModal');
    modal.classList.remove('show');

    // Esconder formulário de contribuição
    const contributionForm = document.getElementById('contributionForm');
    if (contributionForm) {
        contributionForm.style.display = 'none';
    }
}

function copyPixKey() {
    const pixKeyFull = '53243721881'; // CPF completo sem formatação
    const copyBtn = document.getElementById('copyBtn');
    const contributionForm = document.getElementById('contributionForm');

    // Copiar para clipboard
    navigator.clipboard.writeText(pixKeyFull)
        .then(() => {
            // Feedback visual
            copyBtn.classList.add('copied');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 10L8 14L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Copiado!</span>
            `;

            // Mostrar notificação
            showNotification('Chave PIX copiada! 💙 Agora informe o valor após fazer o PIX.', 'success');

            // Mostrar formulário de contribuição
            if (contributionForm) {
                contributionForm.style.display = 'block';
            }

            // Reverter após 3 segundos
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalHTML;
            }, 3000);
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);
            showNotification('Não foi possível copiar. Tente selecionar e copiar manualmente.', 'error');
        });
}

// Registrar contribuição (Firebase ou LocalStorage)
async function registerContribution() {
    const contributorNameInput = document.getElementById('contributorName');
    const contributionInput = document.getElementById('contributionValue');
    const contributorName = contributorNameInput.value.trim();
    const value = parseFloat(contributionInput.value);

    // Validar nome
    if (!contributorName) {
        showNotification('Por favor, informe seu nome.', 'error');
        return;
    }

    // Validar valor
    if (!value || value <= 0) {
        showNotification('Por favor, informe um valor válido.', 'error');
        return;
    }

    // Verificar se a finalidade já está completa
    const progressData = await loadFromDatabase();
    const currentValue = progressData[selectedPurpose] || 0;
    const goal = PURPOSE_GOALS[selectedPurpose];

    if (currentValue >= goal) {
        showNotification('Esta finalidade já atingiu a meta! Escolha outra opção. 😊', 'info');
        return;
    }

    try {
        // Salvar no banco de dados (Firebase ou LocalStorage)
        const result = await saveToDatabase(selectedPurpose, value, contributorName);

        if (result.success) {
            // Atualizar interface
            const percentage = (result.newValue / result.goal) * 100;
            updateProgressBar(selectedPurpose, result.newValue, result.goal, percentage);

            // Feedback ao usuário
            const remaining = result.goal - result.newValue;
            let message = `Contribuição de R$ ${value.toFixed(2)} registrada com sucesso! 💙`;

            if (remaining > 0) {
                message += ` Faltam R$ ${remaining.toFixed(2)} para completar esta meta.`;
            } else {
                message += ` Meta completada! 🎉`;
            }

            showNotification(message, 'success');

            // Limpar campos e esconder formulário
            contributorNameInput.value = '';
            contributionInput.value = '';
            const contributionForm = document.getElementById('contributionForm');
            if (contributionForm) {
                setTimeout(() => {
                    contributionForm.style.display = 'none';
                }, 3000);
            }
        } else {
            showNotification('Erro ao registrar contribuição. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao registrar contribuição:', error);
        showNotification('Erro ao registrar contribuição. Tente novamente.', 'error');
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const pixModal = document.getElementById('pixModal');
    if (e.target === pixModal) {
        closePixModal();
    }
});

// ===== FUNÇÃO DE DESENVOLVIMENTO - RESETAR TIMER (SOMENTE ADMIN) =====
// Função de reset protegida - apenas para administradores autenticados
window.resetTimer = async function () {
    try {
        // Verificar se é admin
        const isAdmin = localStorage.getItem(CONFIG.storage.adminToken);

        if (!isAdmin) {
            alert('Acesso negado! Somente administradores podem resetar o timer.');
            return;
        }

        const confirma = confirm('Resetar o timer de confirmação?\n\nIsso vai reiniciar o cronômetro de 1 semana.');
        if (!confirma) return;

        // Remover o registro de primeira visita
        localStorage.removeItem(CONFIG.timerKey);

        // Recarregar a página para reiniciar o timer
        console.log('Timer resetado! Recarregando página...');
        location.reload();
    } catch (error) {
        console.error('Erro ao resetar timer:', error);
    }
};

console.log('Sistema Save the Date carregado com sucesso!');
console.log('Para acesso administrativo, visite: /admin-login.html');

