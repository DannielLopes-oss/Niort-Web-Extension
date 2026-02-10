// content.js

// 1. Cria o HTML do Widget
const container = document.createElement('div');
container.id = 'niort-widget-container';
container.className = 'niort-dimmed'; // Começa meio transparente

const chatWindow = document.createElement('div');
chatWindow.id = 'niort-chat-window';
chatWindow.innerHTML = `
    <div class="niort-header">
        <span>Niort Bot AI</span>
        <button id="niort-sync-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;" title="Sincronizar Histórico">🔄</button>
    </div>
    <div id="niort-messages">
        <div style="margin-bottom: 10px; background: #e0e7ff; padding: 8px 12px; border-radius: 15px 15px 15px 0; color: #333; max-width: 80%;">
            Olá! Sou o Niort. Clique no 🔄 para eu aprender com seu histórico!
        </div>
    </div>
    <div class="niort-input-area">
        <input type="text" id="niort-input" placeholder="Pergunte algo...">
        <button id="niort-send">Enviar</button>
    </div>
`;

const launcherBtn = document.createElement('div');
launcherBtn.id = 'niort-launcher';
launcherBtn.innerHTML = '🤖'; 

container.appendChild(chatWindow);
container.appendChild(launcherBtn);
document.body.appendChild(container);

// Lógica do Botão de Sincronizar
document.getElementById('niort-sync-btn').addEventListener('click', () => {
    // Envia mensagem para o background.js pedindo a sincronização
    chrome.runtime.sendMessage({ action: "SYNC_HISTORY" }, (response) => {
        const msgDiv = document.getElementById('niort-messages');
        msgDiv.innerHTML += `
            <div style="margin-bottom: 10px; display: flex; justify-content: flex-start;">
                <div style="background: #d1fae5; color: #065f46; padding: 8px 12px; border-radius: 15px 15px 15px 0; max-width: 80%;">
                    🔄 Iniciando leitura do histórico... Verifique o terminal do Python!
                </div>
            </div>
        `;
    });
});

// 2. Controle de Estado
let chatOpen = false;

launcherBtn.addEventListener('click', () => {
    chatOpen = !chatOpen;
    chatWindow.style.display = chatOpen ? 'flex' : 'none';
    updateOpacity();
    
    if(chatOpen) {
        // Foca no input ao abrir
        setTimeout(() => document.getElementById('niort-input').focus(), 100);
    }
});

// 3. Enviar Mensagem para o Backend
async function sendMessage() {
    const input = document.getElementById('niort-input');
    const text = input.value.trim();
    if (!text) return;

    const msgDiv = document.getElementById('niort-messages');
    
    // Adiciona msg do usuário
    msgDiv.innerHTML += `
        <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
            <div style="background: #764ba2; color: white; padding: 8px 12px; border-radius: 15px 15px 0 15px; max-width: 80%;">
                ${text}
            </div>
        </div>
    `;
    input.value = '';
    msgDiv.scrollTop = msgDiv.scrollHeight;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                user_message: text, 
                context_url: window.location.href 
            })
        });
        
        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();
        
        // Adiciona resposta do Bot
        msgDiv.innerHTML += `
            <div style="margin-bottom: 10px; display: flex; justify-content: flex-start;">
                <div style="background: #e0e7ff; color: #333; padding: 8px 12px; border-radius: 15px 15px 15px 0; max-width: 80%;">
                    ${data.reply}
                </div>
            </div>
        `;
        msgDiv.scrollTop = msgDiv.scrollHeight;

    } catch (error) {
        console.error("Erro Niort Bot:", error);
        msgDiv.innerHTML += `<div style="color: red; font-size: 12px; text-align: center;">Erro de conexão com o servidor.</div>`;
    }
}

document.getElementById('niort-send').addEventListener('click', sendMessage);
document.getElementById('niort-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// 4. Lógica Inteligente de Opacidade (Video Detection)
let isVideoPlaying = false;

function checkVideoStatus() {
    const videos = document.querySelectorAll('video');
    let playing = false;
    videos.forEach(video => {
        // Verifica se o vídeo está tocando e é visível na tela
        if (!video.paused && !video.ended && video.readyState > 2) {
            playing = true;
        }
    });
    
    if (isVideoPlaying !== playing) {
        isVideoPlaying = playing;
        updateOpacity();
    }
}

function updateOpacity() {
    // Se o chat está aberto, sempre visível
    if (chatOpen) {
        container.className = 'niort-visible';
        return;
    }

    // Se o mouse está em cima, visível
    if (container.matches(':hover')) {
        container.className = 'niort-visible';
        return;
    }

    // Se tem vídeo tocando, fica "fantasminha"
    if (isVideoPlaying) {
        container.className = 'niort-hidden';
    } else {
        // Estado normal (inativo mas sem vídeo)
        container.className = 'niort-dimmed';
    }
}

container.addEventListener('mouseenter', updateOpacity);
container.addEventListener('mouseleave', updateOpacity);

// Verifica status do vídeo a cada 1 segundo
setInterval(checkVideoStatus, 1000);