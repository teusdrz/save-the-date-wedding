// ===== CONFIGURAÇÃO E CONSTANTES =====
const CONFIG = {
    formData: [],
    storageKey: 'saveTheDate_rsvp',
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    initializeGuestFilter();
    initializeModal();
    initializeCarousel();
    initializeSmoothScroll();
    initializeIntersectionObserver();
    loadSavedData();
});

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

// ===== WHATSAPP =====
function sendToWhatsApp(guestName, fullName, attendance, message = '') {
    const phoneNumber = '5511932049040'; // Seu WhatsApp

    let whatsappMessage = '';

    if (attendance === 'yes') {
        // Nome completo foi fornecido
        whatsappMessage = `Olá! Eu, *${fullName}*, confirmo minha presença nesse grande dia! 🎉`;

        if (message.trim()) {
            whatsappMessage += `\n\n_Mensagem:_ ${message}`;
        }
    } else {
        // Não confirmou presença
        whatsappMessage = `Olá! Infelizmente *${guestName}* não poderá comparecer ao casamento. 😔`;

        if (message.trim()) {
            whatsappMessage += `\n\n_Mensagem:_ ${message}`;
        }
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

function saveRSVP(data) {
    // Obter dados existentes
    let savedData = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];

    // Verificar se o convidado já confirmou
    const existingIndex = savedData.findIndex(item => item.guestName === data.guestName);

    if (existingIndex !== -1) {
        // Atualizar confirmação existente
        savedData[existingIndex] = data;
        showNotification('Confirmação atualizada com sucesso!', 'success');
    } else {
        // Adicionar nova confirmação
        savedData.push(data);
    }

    // Salvar no localStorage
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(savedData));

    // Enviar para servidor (implementar quando tiver backend)
    // sendToServer(data);
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
