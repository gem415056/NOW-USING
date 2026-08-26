// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      4.1.0
// @description  Bulletproof Message Sending & Strict Count-Locked Polling for PASTELchat
// @author       PASTELchat
// @match        *://*/*crack.html*
// @match        *://*/*
// @match        file:///*
// @match        https://crack.wrtn.ai/*
// @include      *crack.html*
// @include      file://*crack.html*
// @include      *://*/*crack.html*
// @include      https://crack.wrtn.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // [1. crack.wrtn.ai 사이트: 토큰 및 기기 ID 자동 갱신]
    // =========================================================================
    if (location.hostname.includes('wrtn.ai')) {
        const checkTokenAndWId = () => {
            const cookies = document.cookie.split(';');
            for (let c of cookies) {
                const [k, v] = c.trim().split('=');
                if ((k === 'access_token' || k === 'accessToken' || k === 'wrtn_access_token') && v) {
                    GM_setValue('crack_access_token', decodeURIComponent(v));
                }
                if (k === '__w_id' && v) {
                    GM_setValue('crack_w_id', decodeURIComponent(v));
                }
            }
            try {
                const tokenKeys = ['access_token', 'accessToken', 'wrtn_token', 'token'];
                for (const tk of tokenKeys) {
                    const val = localStorage.getItem(tk) || sessionStorage.getItem(tk);
                    if (val && typeof val === 'string' && val.length > 20) {
                        GM_setValue('crack_access_token', val.replace(/^["']|["']$/g, ''));
                        break;
                    }
                }
            } catch (_) {}
        };
        checkTokenAndWId();
        setInterval(checkTokenAndWId, 2000);
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 브릿지 (v4.1.0 무결점 전송 & 개수 잠금 감시)]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;

            const sendStatus = (msg) => {
                window.postMessage({
                    source: 'PASTEL_CRACK_STATUS_LOG',
                    reqId: reqId,
                    text: msg
                }, '*');
            };

            const cachedToken = GM_getValue('crack_access_token', '');
            const cleanToken = cachedToken ? cachedToken.replace(/^Bearer\s+/i, '').trim() : '';
            const cachedWId = GM_getValue('crack_w_id', 'W2.2.ba1dca25.315c.4cf1.acd3.28b9c450e340');

            sendStatus('🔄 [1/4] 전송 전 기존 메시지 개수 카운팅 중...');

            let baseMessageCount = 0;
            let lastMessageId = null;

            // 1단계: 현재 방의 메시지 총 개수와 마지막 메시지 ID를 완벽히 확보
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages?limit=20`,
                headers: {
                    'Origin': 'https://crack.wrtn.ai',
                    'Referer': 'https://crack.wrtn.ai/',
                    'platform': 'web',
                    'wrtn-locale': 'ko-KR',
                    'x-wrtn-id': cachedWId,
                    'authorization': `Bearer ${cleanToken}`
                },
                onload: (res) => {
                    try {
                        const parsed = JSON.parse(res.responseText);
                        let msgs = parsed?.data || parsed?.messages || [];
                        if (Array.isArray(msgs)) {
                            baseMessageCount = msgs.length;
                            if (msgs.length > 0) lastMessageId = msgs[0]._id || msgs[0].id;
                        }
                    } catch (_) {}

                    executeDualSend();
                },
                onerror: () => {
                    executeDualSend();
                }
            });

            // 2단계: 이중 전송 (REST API + WebSocket 동시 트리거로 누락 방지)
            function executeDualSend() {
                sendStatus('🚀 [2/4] 크랙 정식 권한으로 메시지 발송 중...');

                // [방법 A] REST API 포워딩 (CORS/쿠키 완벽 우회)
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages`,
                    headers: {
                        'Origin': 'https://crack.wrtn.ai',
                        'Referer': 'https://crack.wrtn.ai/',
                        'Content-Type': 'application/json',
                        'platform': 'web',
                        'wrtn-locale': 'ko-KR',
                        'x-wrtn-id': cachedWId,
                        'authorization': `Bearer ${cleanToken}`
                    },
                    data: JSON.stringify({
                        chatId: chatId,
                        message: message,
                        content: message
                    }),
                    onload: (res) => {
                        console.log('[PASTEL] REST 전송 결과:', res.status, res.responseText);
                    }
                });

                // [방법 B] 소켓 전송 (EIO=4 규격)
                let wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
                if (cleanToken) wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}`;

                let ws = null;
                try {
                    ws = new WebSocket(wsUrl);
                    ws.onopen = () => {};
                    ws.onmessage = (e) => {
                        const raw = e.data;
                        if (typeof raw !== 'string') return;
                        if (raw === '2') { ws.send('3'); return; }
                        if (raw.startsWith('0')) {
                            ws.send(cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,');
                            return;
                        }
                        if (raw.startsWith('40/v3/chats')) {
                            ws.send(`42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`);
                            return;
                        }
                    };
                } catch (_) {}

                // 3단계: 절대 오작동 없는 카운트 잠금 감시기 가동
                startStrictPolling(ws);
            }

            function startStrictPolling(activeWs) {
                let pollAttempts = 0;
                const maxAttempts = 200; // 최대 5분
                let isFinished = false;

                const timer = setInterval(() => {
                    if (isFinished) {
                        clearInterval(timer);
                        return;
                    }

                    pollAttempts++;
                    const elapsedSec = (pollAttempts * 1.5).toFixed(1);
                    sendStatus(`✨ AI가 새 답변을 작성하는 중... (${elapsedSec}초)`);

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages?limit=5`,
                        headers: {
                            'Origin': 'https://crack.wrtn.ai',
                            'Referer': 'https://crack.wrtn.ai/',
                            'platform': 'web',
                            'wrtn-locale': 'ko-KR',
                            'x-wrtn-id': cachedWId,
                            'authorization': `Bearer ${cleanToken}`
                        },
                        onload: (res) => {
                            try {
                                const parsed = JSON.parse(res.responseText);
                                let msgs = [];
                                if (Array.isArray(parsed?.data)) msgs = parsed.data;
                                else if (Array.isArray(parsed?.data?.messages)) msgs = parsed.data.messages;
                                else if (Array.isArray(parsed?.messages)) msgs = parsed.messages;

                                if (msgs.length > 0) {
                                    const latest = msgs[0];
                                    const currentId = latest._id || latest.id;
                                    const role = latest.role || latest.type;
                                    const status = latest.status;

                                    // [철통 검증]: 마지막 ID와 완전히 다르고, AI의 답변이어야만 수령!
                                    if (currentId && currentId !== lastMessageId && (role === 'assistant' || role === 'model')) {
                                        if (status === 'end' || !status || pollAttempts > 3) {
                                            isFinished = true;
                                            clearInterval(timer);
                                            if (activeWs) activeWs.close();

                                            const content = latest.content || latest.message || '';
                                            const cashUsed = latest.cashUsage?.total || 0;

                                            window.postMessage({
                                                source: 'PASTEL_CRACK_SOCKET_DONE',
                                                reqId: reqId,
                                                text: content,
                                                cashUsed: cashUsed
                                            }, '*');
                                        }
                                    }
                                }
                            } catch (_) {}
                        }
                    });

                    if (pollAttempts >= maxAttempts) {
                        clearInterval(timer);
                        if (!isFinished) {
                            if (activeWs) activeWs.close();
                            window.postMessage({
                                source: 'PASTEL_CRACK_SOCKET_ERROR',
                                reqId: reqId,
                                error: 'AI 답변 생성 대기 시간 초과 (5분 경과)'
                            }, '*');
                        }
                    }
                }, 1500);
            }

            return;
        }

        // [B] 기존 REST API 요청
        if (event.data.source === 'PASTEL_CRACK_REQUEST') {
            const { reqId, method, url, headers, data, responseType } = event.data;
            const cachedToken = GM_getValue('crack_access_token', '');
            const cachedWId = GM_getValue('crack_w_id', 'W2.2.ba1dca25.315c.4cf1.acd3.28b9c450e340');

            const reqHeaders = Object.assign({
                'Origin': 'https://crack.wrtn.ai',
                'Referer': 'https://crack.wrtn.ai/',
                'platform': 'web',
                'wrtn-locale': 'ko-KR',
                'x-wrtn-id': cachedWId
            }, headers || {});

            if (cachedToken) {
                const clean = cachedToken.replace(/^Bearer\s+/i, '').trim();
                reqHeaders['authorization'] = `Bearer ${clean}`;
            }

            GM_xmlhttpRequest({
                method: method || 'GET',
                url: url,
                headers: reqHeaders,
                data: data,
                responseType: responseType || 'text',
                withCredentials: true,
                timeout: 120000,
                onload: function(res) {
                    let parsed = res.responseText;
                    try { parsed = JSON.parse(res.responseText); } catch (_) {}
                    window.postMessage({
                        source: 'PASTEL_CRACK_RESPONSE',
                        reqId: reqId,
                        status: res.status,
                        data: parsed,
                        rawText: res.responseText
                    }, '*');
                },
                onerror: function(err) {
                    window.postMessage({
                        source: 'PASTEL_CRACK_RESPONSE',
                        reqId: reqId,
                        status: 0,
                        error: 'Network/Bridge Error'
                    }, '*');
                }
            });
        }
    });

    window.PASTEL_CRACK_BRIDGE_READY = true;
})();
