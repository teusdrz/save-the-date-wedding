// ===== SISTEMA DE PAGAMENTO PIX =====
// Integrado com Firebase para rastreamento automático

class PixPaymentSystem {
    constructor(db) {
        this.db = db;
        this.pixKey = CONFIG.pix.key; // CPF do .env
        this.pixName = CONFIG.pix.name;
        this.pixCity = CONFIG.pix.city;
    }

    // Gerar código PIX (formato EMV)
    generatePixCode(amount, guestName, guestEmail) {
        // Gerar ID único para transação
        const transactionId = this.generateTransactionId();
        
        // Criar payload PIX (simplificado - para produção use biblioteca completa)
        const pixPayload = this.createPixPayload(amount, transactionId);
        
        // Salvar transação no Firebase como pendente
        this.savePendingTransaction(transactionId, amount, guestName, guestEmail);
        
        return {
            pixCode: pixPayload,
            transactionId: transactionId,
            qrCodeData: pixPayload
        };
    }

    // Criar payload PIX EMV
    createPixPayload(amount, transactionId) {
        // Formato simplificado do PIX
        // Em produção, use uma biblioteca como 'pix-utils' ou API do banco
        const pixKey = this.pixKey;
        const name = this.pixName;
        const city = this.pixCity;
        const txid = transactionId;
        
        // Payload PIX básico (para demonstração)
        // Este é um exemplo simplificado - use biblioteca oficial para produção
        const payload = `PIX|${pixKey}|${name}|${city}|${amount}|${txid}`;
        
        return payload;
    }

    // Salvar transação pendente no Firebase
    async savePendingTransaction(transactionId, amount, guestName, guestEmail) {
        try {
            await this.db.collection(CONFIG.collections.payments).doc(transactionId).set({
                transactionId: transactionId,
                name: guestName,
                email: guestEmail,
                amount: amount,
                status: 'pending',
                pixKey: this.pixKey,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            
            console.log('Transação PIX criada:', transactionId);
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
        }
    }

    // Verificar status do pagamento
    async checkPaymentStatus(transactionId) {
        try {
            const doc = await this.db.collection(CONFIG.collections.payments).doc(transactionId).get();
            
            if (doc.exists) {
                return doc.data().status;
            }
            return 'not_found';
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            return 'error';
        }
    }

    // Confirmar pagamento manualmente (admin)
    async confirmPayment(transactionId) {
        try {
            await this.db.collection(CONFIG.collections.payments).doc(transactionId).update({
                status: 'confirmed',
                confirmedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Pagamento confirmado:', transactionId);
            return true;
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            return false;
        }
    }

    // Gerar ID único para transação
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `PIX${timestamp}${random}`;
    }

    // Listener em tempo real para mudanças no status do pagamento
    listenToPaymentStatus(transactionId, callback) {
        return this.db.collection(CONFIG.collections.payments)
            .doc(transactionId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    callback(data.status, data);
                }
            });
    }
}

// Exportar classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixPaymentSystem;
}
