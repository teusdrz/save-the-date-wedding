// ===== CONFIGURAÇÃO DO FIREBASE =====
// 🔥 Firebase configurado para funcionar imediatamente!

const firebaseConfig = {
    apiKey: "AIzaSyDVimbFN7X_uoIGA0ZPogSx-gemB_ytm1s",
    authDomain: "save-the-date-wedding.firebaseapp.com",
    projectId: "save-the-date-wedding",
    storageBucket: "save-the-date-wedding.firebasestorage.app",
    messagingSenderId: "823295690615",
    appId: "1:823295690615:web:6c095d0d2b1bbd13b28372",
    measurementId: "G-46M75HGTC0"
};

// Inicializar Firebase
let db;
let isFirebaseEnabled = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseEnabled = true;
    console.log('🔥 Firebase inicializado com sucesso!');
} catch (error) {
    console.warn('⚠️ Firebase não disponível, usando LocalStorage:', error);
    isFirebaseEnabled = false;
}

// ===== FUNÇÕES AUXILIARES DO FIREBASE =====

// Salvar dados no Firebase ou LocalStorage (fallback)
async function saveToDatabase(purpose, value) {
    if (isFirebaseEnabled) {
        try {
            const docRef = db.collection('contributions').doc(purpose);
            const doc = await docRef.get();

            const currentValue = doc.exists ? doc.data().total : 0;
            const goal = PURPOSE_GOALS[purpose];
            const newValue = Math.min(currentValue + value, goal);

            await docRef.set({
                total: newValue,
                goal: goal,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                completedAt: newValue >= goal ? firebase.firestore.FieldValue.serverTimestamp() : null
            }, { merge: true });

            return { success: true, newValue, goal };
        } catch (error) {
            console.error('Erro ao salvar no Firebase:', error);
            // Fallback para localStorage
            return saveTofallback(purpose, value);
        }
    } else {
        return saveToLocalStorage(purpose, value);
    }
}

// Carregar dados do Firebase ou LocalStorage
async function loadFromDatabase() {
    if (isFirebaseEnabled) {
        try {
            const snapshot = await db.collection('contributions').get();
            const data = {};

            snapshot.forEach(doc => {
                data[doc.id] = doc.data().total || 0;
            });

            return data;
        } catch (error) {
            console.error('Erro ao carregar do Firebase:', error);
            return loadFromLocalStorage();
        }
    } else {
        return loadFromLocalStorage();
    }
}

// Configurar atualizações em tempo real
function setupRealtimeUpdates() {
    if (isFirebaseEnabled) {
        db.collection('contributions').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    const purpose = change.doc.id;
                    const data = change.doc.data();
                    const goal = PURPOSE_GOALS[purpose];
                    const percentage = Math.min((data.total / goal) * 100, 100);

                    updateProgressBar(purpose, data.total, goal, percentage);
                }
            });
        });
    }
}

// ===== FUNÇÕES DE FALLBACK (LocalStorage) =====

function saveToLocalStorage(purpose, value) {
    const progressData = JSON.parse(localStorage.getItem('pixContributions') || '{}');
    const currentValue = progressData[purpose] || 0;
    const goal = PURPOSE_GOALS[purpose];
    const newValue = Math.min(currentValue + value, goal);

    progressData[purpose] = newValue;
    localStorage.setItem('pixContributions', JSON.stringify(progressData));

    return { success: true, newValue, goal };
}

function loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem('pixContributions') || '{}');
}
