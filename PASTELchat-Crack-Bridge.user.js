// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      3.9.0
// @description  Direct Message Sending with Extended 5-Min Polling for Claude Models
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
    // [2. crack.html 통신 브릿지: 롱타임 클로드 완벽 지원 엔진]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [A] 하이브리드 채팅 전송 & 수신 요청
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

            sendStatus('🔄 [1/3] 크랙 서버 접속 및 인증 중...');

            let wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
            if (cleanToken) wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}`;

            let ws = null;
            let pollingTimer = null;
            let isCompleted = false;

            // 스마트 감시기: 최대 5분(300초) 동안 1.5초마다 완료 여부 체크
            const startSmartPolling = () => {
                let pollAttempts = 0;
                const maxAttempts = 200; // 200 * 1.5초 = 300초 (5분)

                pollingTimer = setInterval(() => {
                    if (isCompleted) {
                        clearInterval(pollingTimer);
                        return;
                    }

                    pollAttempts++;
                    const elapsedSec = (pollAttempts * 1.5).toFixed(1);
                    sendStatus(`✨ AI가 장문의 답변을 작성하고 있습니다... (${elapsedSec}초 경과)`);

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
                                    const latest = msgs[0]; // 최신 메시지
                                    const role = latest.role || latest.type;
                                    const status = latest.status; // end, generating 등

                                    // 최신 메시지가 AI이고, 답변 작성이 완전히 종료('end')되었거나 글이 완성된 경우만 수거
                                    if ((role === 'assistant' || role === 'model') && (latest.content || latest.message)) {
                                        if (status === 'end' || !status || pollAttempts > 3) {
                                            isCompleted = true;
                                            clearInterval(pollingTimer);
                                            if (ws) ws.close();

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
                        clearInterval(pollingTimer);
                        if (!isCompleted) {
                            if (ws) ws.close();
                            window.postMessage({
                                source: 'PASTEL_CRACK_SOCKET_ERROR',
                                reqId: reqId,
                                error: 'AI 답변 생성 시간 초과 (5분 경과)'
                            }, '*');
                        }
                    }
                }, 1500);
            };

            try {
                ws = new WebSocket(wsUrl);
            } catch (e) {
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: `소켓 접속 실패: ${e.message}`
                }, '*');
                return;
            }

            ws.onmessage = (e) => {
                const raw = e.data;
                if (typeof raw !== 'string') return;

                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 핸드셰이크 (0)
                if (raw.startsWith('0')) {
                    const authPacket = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                    ws.send(authPacket);
                    return;
                }

                // 네임스페이스 인증 완료 (40/v3/chats) -> 메시지 전송
                if (raw.startsWith('40/v3/chats')) {
                    sendStatus('🚀 메시지 발송 완료! AI 답변 작성 감시 중...');
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // 서버 접수 확인(43) -> 즉시 5분 스마트 감시기 가동
                if (raw.startsWith('43/v3/chats')) {
                    if (!pollingTimer) {
                        startSmartPolling();
                    }
                    return;
                }

                // 만약 웹소켓으로도 완료 이벤트가 들어오면 즉시 수령
                if (raw.includes('characterMessageGenerated')) {
                    isCompleted = true;
                    if (pollingTimer) clearInterval(pollingTimer);
                    try {
                        const jsonStartIndex = raw.indexOf('[');
                        if (jsonStartIndex !== -1) {
                            const [eventName, payload] = JSON.parse(raw.slice(jsonStartIndex));
                            const finalContent = payload?.data?.content || '';
                            const cashUsed = payload?.data?.cashUsage?.total || 0;
                            window.postMessage({
                                source: 'PASTEL_CRACK_SOCKET_DONE',
                                reqId: reqId,
                                text: finalContent,
                                cashUsed: cashUsed
                            }, '*');
                            ws.close();
                        }
                    } catch (_) {}
                }
            };

            ws.onerror = () => {
                if (!pollingTimer) startSmartPolling();
            };

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
