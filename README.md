# 🤖 Niort Bot - AI Browser Assistant (Local RAG)

> **Sua assistente de navegação inteligente, privada e proativa.**

O **Niort Bot** é uma extensão de navegador open-source que utiliza Inteligência Artificial Local (Local LLM) para aprender com seu histórico de navegação e oferecer assistência contextual. Ele funciona offline (após baixar os modelos), garantindo que seus dados de navegação nunca saiam da sua máquina.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-green)
![Ollama](https://img.shields.io/badge/AI-Ollama-orange)

## ✨ Funcionalidades Principais

* **🧠 Memória Contextual (RAG):** Converse com o bot sobre sites que você visitou. Ele "lembra" do conteúdo através de um banco de dados vetorial local (ChromaDB).
* **🔒 Privacy-First:** Toda a análise de dados e geração de texto roda localmente no seu computador usando o Ollama. Nenhum dado de histórico é enviado para nuvens de terceiros.
* **👻 Modo Fantasma (Smart UI):** O widget detecta automaticamente quando você está assistindo a um vídeo e se torna transparente para não atrapalhar sua experiência.
* **💡 Recomendações Proativas:** O bot analisa seus interesses recentes e envia notificações sutis (tooltips) sugerindo o que pesquisar ou estudar a seguir.
* **⚡ Leve e Rápido:** Backend em FastAPI e Frontend em Vanilla JS otimizado (Manifest V3).

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido em duas partes principais (Monorepo):

```text
niort-bot/
├── backend/            # O "Cérebro" (Python/FastAPI + LangChain + ChromaDB)
│   ├── niort_db/       # Banco de dados vetorial (criado automaticamente)
│   ├── main.py         # API Server
│   ├── brain.py        # Lógica de RAG e conexão com Ollama
│   └── requirements.txt
│
└── extension/          # O "Corpo" (Chrome Extension Manifest V3)
    ├── background.js   # Service Worker (Gerencia comunicação e notificações)
    ├── content.js      # UI Injetada (Widget e Chat)
    └── styles.css      # Estilização e Animações
```
## 🚀 Pré-requisitos

Antes de começar, você precisa ter instalado no seu computador:

1.  **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
2.  **Ollama**: O motor que roda a IA localmente. [Download Ollama](https://ollama.com/)

### Configuração da IA (Obrigatório)
Após instalar o Ollama, abra seu terminal e baixe o modelo de IA.
*Recomendamos o `gemma2:2b` por ser leve e rápido, mas você pode usar o `llama3` se tiver uma máquina potente.*

```bash
# Abra o terminal e digite:
ollama pull gemma2:2b