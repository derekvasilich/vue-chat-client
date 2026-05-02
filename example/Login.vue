<template>        
    <authenticator>
      <template v-slot="{ signOut }">
        <ChatWidget />
        <div class="container">
            <h1>AI Chat Widget</h1>
            <p class="subtitle">Developer test harness — the chat bubble is in the bottom-right corner ↘</p>

            <div class="card">
            <h2>🔑 Token Management</h2>
            <label for="token-input">JWT / Bearer Token</label>
            <div class="row">
                <input id="token-input" type="text" placeholder="Paste your JWT here…" />
                <button onclick="setToken()">Set Token</button>
            </div>
            <div class="status" id="token-status"></div>
            </div>

            <div class="card">
            <h2>📨 Send a Message Programmatically</h2>
            <label for="msg-input">Message text</label>
            <div class="row">
                <input id="msg-input" type="text" placeholder="Hello, what can you do?" value="Hello! What can you help me with?" />
                <button onclick="sendMsg()">Send via postMessage</button>
                <button class="secondary" onclick="sendDirect()">Send direct</button>
            </div>
            <div class="status" id="msg-status"></div>
            </div>

            <div class="card">
            <h2>🪟 Widget Controls</h2>
            <div class="row" style="margin-top:0">
                <button onclick="window.AIChatWidget.open()">Open</button>
                <button class="secondary" onclick="window.AIChatWidget.close()">Close</button>
            </div>
            </div>

            <div class="card">
            <h2>📋 Script Tag Integration</h2>
            <pre>&lt;script
                src="https://your-cdn.example.com/ai-chat-widget.js"
                data-api-endpoint="https://api.example.com"
                data-token="eyJhbGciOiJIUzI1NiJ9..."
                data-welcome-message="Hi! How can I assist you?"
                &gt;&lt;/script&gt;</pre>
            </div>

            <div class="card">
            <h2>📡 postMessage API Reference</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                <tr style="background:#f8fafc">
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Event type</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Payload</th>
                </tr>
                </thead>
                <tbody>
                <tr><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>AI_CHAT_SEND</code></td><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>{ type, message: string }</code></td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>AI_CHAT_SET_TOKEN</code></td><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>{ type, token: string }</code></td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>AI_CHAT_OPEN</code></td><td style="padding:8px;border-bottom:1px solid #f1f5f9"><code>{ type }</code></td></tr>
                <tr><td style="padding:8px"><code>AI_CHAT_CLOSE</code></td><td style="padding:8px"><code>{ type }</code></td></tr>
                </tbody>
            </table>
            </div>
        </div>
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
</template>
<script setup lang="ts">
import ChatWidget from '../src/ChatWidget.vue'
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import { Amplify, ResourcesConfig } from 'aws-amplify';
const config: ResourcesConfig = {};
Amplify.configure(config);
</script>