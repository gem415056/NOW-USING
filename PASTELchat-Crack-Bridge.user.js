// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      3.5.0
// @description  Direct WebSocket streaming and REST API bridge for PASTELchat crack.html
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
    // [2. crack.html 통신 브릿지 (Socket.IO 웹소켓 직접 통신)]
    // =========================================================================
    let activeWS = null;
    let wsHeartbeatTimer = null;

    function createCrackSocket(onOpen, onMessage, onError, onClose) {
        if (activeWS && activeWS.readyState === WebSocket.OPEN) {
            onOpen(activeWS);
            return;
        }

        const wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('[PASTEL-WS] 크랙 소켓 서버 연결 성공');
        };

        ws.onmessage = (e) => {
            const raw = e.data;
            if (typeof raw !== 'string') return;

            // 1. Engine.IO Ping/Pong 처리
            if (raw === '2') {
                ws.send('3'); // Pong 응답
                return;
            }

            // 2. 초기 연결 핸드셰이크 수신
            if (raw.startsWith('0')) {
                // 네임스페이스 /v3/chats 접속 요청
                const cachedToken = GM_getValue('crack_access_token', '');
                const cleanToken = cachedToken ? cachedToken.replace(/^Bearer\s+/i, '').trim() : '';
                const authPayload = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                ws.send(authPayload);
                return;
            }

            // 3. /v3/chats 접속 완료
            if (raw.startsWith('40/v3/chats')) {
                console.log('[PASTEL-WS] /v3/chats 네임스페이스 진입 완료');
                onOpen(ws);
                return;
            }

            // 4. 이벤트 메시지 수신 (42/v3/chats,...)
            if (raw.startsWith('42/v3/chats,')) {
                try {
                    const jsonStr = raw.replace(/^42\/v3\/chats,\d*/, '');
                    const [eventName, payload] = JSON.parse(jsonStr);
                    onMessage(eventName, payload);
                } catch (err) {
                    console.warn('[PASTEL-WS] JSON 파싱 에러:', err, raw);
                }
            }
        };

        ws.onerror = (err) => {
            console.error('[PASTEL-WS] 웹소켓 에러:', err);
            if (onError) onError(err);
        };

        ws.onclose = () => {
            console.log('[PASTEL-WS] 소켓 연결 종료');
            activeWS = null;
            if (onClose) onClose();
        };

        activeWS = ws;
    }

    // crack.html의 요청 리스너
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [A] Socket.IO 실시간 채팅 전송 요청
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;

            createCrackSocket(
                (ws) => {
                    // 전송 패킷 발송: 42/v3/chats,["send",{"chatId":"...","message":"..."}]
                    const payload = `42/v3/chats,["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(payload);
                    console.log('[PASTEL-WS] 메시지 송신 완료:', chatId);
                },
                (eventName, payload) => {
                    // 1. 실시간 텍스트 누적 스트리밍
                    if (eventName === 'characterMessageGenerating') {
                        const chunk = payload?.data?.chunk || '';
                        window.postMessage({
                            source: 'PASTEL_CRACK_SOCKET_CHUNK',
                            reqId: reqId,
                            text: chunk
                        }, '*');
                    }
                    // 2. 생성 완료
                    else if (eventName === 'characterMessageGenerated') {
                        const finalContent = payload?.data?.content || '';
                        const cashUsed = payload?.data?.cashUsage?.total || 0;
                        window.postMessage({
                            source: 'PASTEL_CRACK_SOCKET_DONE',
                            reqId: reqId,
                            text: finalContent,
                            cashUsed: cashUsed
                        }, '*');
                    }
                },
                (err) => {
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: '웹소켓 통신 오류'
                    }, '*');
                }
            );
            return;
        }

        // [B] 기존 REST API 요청 (대화 목록 / 캐시 조회)
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
