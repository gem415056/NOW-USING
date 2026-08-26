// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      4.2.0
// @description  Pure WebSocket Event-Driven Engine (Zero Old Turn Echo) for PASTELchat
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
    // [2. crack.html 통신 브릿지 (v4.2.0 순수 소켓 이벤트 감지)]
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

            sendStatus('🔄 [1/3] 소켓 연결 및 인증 핸드셰이크...');

            let wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
            if (cleanToken) wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}`;

            let ws = null;
            let timeoutTimer = null;
            let sendTime = 0;
            let hasReceivedResponsePacket = false;

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

            // 60초 타임아웃
            timeoutTimer = setTimeout(() => {
                if (ws && !hasReceivedResponsePacket) {
                    ws.close();
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: '메시지 발송 후 60초 동안 서버로부터 수신 패킷이 도착하지 않았습니다.'
                    }, '*');
                }
            }, 60000);

            ws.onopen = () => {};

            ws.onmessage = (e) => {
                const raw = e.data;
                if (typeof raw !== 'string') return;

                // Ping/Pong
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // [단계 1] 핸드셰이크 수신 (0) -> 네임스페이스 접속 요청
                if (raw.startsWith('0')) {
                    sendStatus('🔄 [2/3] /v3/chats 네임스페이스 진입 중...');
                    const authPacket = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                    ws.send(authPacket);
                    return;
                }

                // [단계 2] 네임스페이스 승인 (40/v3/chats) -> 송신(SEND) 발사!
                if (raw.startsWith('40/v3/chats')) {
                    sendTime = Date.now();
                    sendStatus('🚀 [3/3] 메시지 송신 완료! 서버 수신 대기 중...');

                    // 송신 패킷 발사
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // [단계 3] 송신 이후, 서버에서 수신(RECV)되는 패킷 감지!
                if (sendTime > 0) {
                    // 1. 실시간 텍스트 생성 패킷 수신
                    if (raw.includes('characterMessageGenerating')) {
                        hasReceivedResponsePacket = true;
                        clearTimeout(timeoutTimer);

                        try {
                            const jsonStartIndex = raw.indexOf('[');
                            if (jsonStartIndex !== -1) {
                                const [eventName, payload] = JSON.parse(raw.slice(jsonStartIndex));
                                const chunk = payload?.data?.chunk || '';
                                window.postMessage({
                                    source: 'PASTEL_CRACK_SOCKET_CHUNK',
                                    reqId: reqId,
                                    text: chunk
                                }, '*');
                            }
                        } catch (_) {}
                        return;
                    }

                    // 2. 최종 완료 패킷 수신
                    if (raw.includes('characterMessageGenerated')) {
                        hasReceivedResponsePacket = true;
                        clearTimeout(timeoutTimer);

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
                        return;
                    }

                    // 3. 서버 거부 또는 에러 응답 수신
                    if (raw.startsWith('44/v3/chats') || raw.includes('"result":"error"')) {
                        clearTimeout(timeoutTimer);
                        window.postMessage({
                            source: 'PASTEL_CRACK_SOCKET_ERROR',
                            reqId: reqId,
                            error: `서버 거부 응답: ${raw.slice(0, 80)}`
                        }, '*');
                        ws.close();
                        return;
                    }

                    // 4. 기타 서버 수신 패킷 실시간 출력
                    if (!hasReceivedResponsePacket && raw !== '3') {
                        const elapsed = ((Date.now() - sendTime) / 1000).toFixed(1);
                        sendStatus(`📨 [수신 감지 ${elapsed}s] ${raw.slice(0, 40)}...`);
                    }
                }
            };

            ws.onerror = (err) => {
                clearTimeout(timeoutTimer);
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: '웹소켓 통신 오류'
                }, '*');
            };

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
