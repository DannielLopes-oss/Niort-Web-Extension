// extension/background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Rota de Sincronizar Histórico
    if (request.action === "SYNC_HISTORY") {
        syncHistory();
        sendResponse({ status: "Sincronização iniciada..." });
        return true; 
    }
    
    // 2. NOVA ROTA: Mensagem do Chat
    if (request.action === "CHAT_MESSAGE") {
        enviarMensagemParaPython(request.payload, sendResponse);
        return true; // Importante: mantém a porta aberta para a resposta assíncrona
    }
});

// Função que fala com a API de Chat do Python
async function enviarMensagemParaPython(payload, sendResponse) {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Falha na resposta da API");
        
        const data = await response.json();
        sendResponse({ success: true, data: data }); // Devolve pro content.js
    } catch (error) {
        console.error("Erro no Background:", error);
        sendResponse({ success: false, error: error.message });
    }
}

// Função de Sincronizar Histórico (que você já tinha)
async function syncHistory() {
    console.log("Iniciando varredura do histórico...");
    try {
        const historyItems = await chrome.history.search({
            text: "", 
            maxResults: 1000,
            startTime: 0 
        });

        const payload = historyItems.map(item => ({
            url: item.url,
            title: item.title || "Sem título",
            visit_time: new Date(item.lastVisitTime).toISOString()
        }));

        const response = await fetch("http://127.0.0.1:8000/api/sync-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("Histórico enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar histórico para o Python:", error);
    }
}

// --- SISTEMA DE NOTIFICAÇÕES PROATIVAS ---

// Checa a cada 1 hora se tem recomendação nova (1 * 60 * 60 * 1000)
// Mas para testarmos agora, deixei a cada 30 segundos! (30000)
setInterval(checkRecommendation, 30000); 

// E também checa logo que a página carrega (espera 5 segundos)
setTimeout(checkRecommendation, 5000);

async function checkRecommendation() {
    console.log("Checando recomendações...");
    try {
        const response = await fetch("http://127.0.0.1:8000/api/recommendation");
        const data = await response.json();

        if (data.message) {
            // Manda a mensagem para a aba que o usuário está usando agora
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if(tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "SHOW_RECOMMENDATION",
                        text: data.message
                    });
                }
            });
        }
    } catch (error) {
        console.log("Nenhuma recomendação nova ou servidor offline.");
    }
}