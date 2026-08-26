// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      3.7.0
// @description  Full Packet Interception and Direct Socket.IO Bridge for PASTELchat
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
    // [2. crack.html 통신 브릿지: 무누락 소켓 엔진]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [A] Socket.IO 실시간 채팅 전송 요청
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

            sendStatus('🔄 [1/4] 크랙 소켓 서버 접속 중...');

            let wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
            if (cleanToken) {
                wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}`;
            }

            let ws = null;
            let timeoutTimer = null;
            let receivedChunk = false;

            try {
                ws = new WebSocket(wsUrl);
            } catch (e) {
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: `소켓 생성 실패: ${e.message}`
                }, '*');
                return;
            }

            // 20초 타임아웃 감시
            timeoutTimer = setTimeout(() => {
                if (ws && !receivedChunk) {
                    ws.close();
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: '서버 응답 시간 초과 (메시지 전송 후 AI 답변 반응 없음)'
                    }, '*');
                }
            }, 20000);

            ws.onopen = () => {
                sendStatus('🔄 [2/4] 소켓 연결됨, 핸드셰이크 수신 대기...');
            };

            ws.onmessage = (e) => {
                const raw = e.data;
                if (typeof raw !== 'string') return;

                // 1. Engine.IO Ping/Pong
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 2. 초기 접속 핸드셰이크 (0)
                if (raw.startsWith('0')) {
                    sendStatus('🔄 [3/4] /v3/chats 네임스페이스 인증 요청...');
                    const authPacket = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                    ws.send(authPacket);
                    return;
                }

                // 3. /v3/chats 네임스페이스 진입 승인 (40/v3/chats)
                if (raw.startsWith('40/v3/chats')) {
                    sendStatus('🚀 [4/4] 인증 성공! 메시지 발송 중...');
                    
                    // 1) 대화방 룸 가입 신호 발송
                    ws.send(`42/v3/chats,["join",{"chatId":"${chatId}"}]`);
                    
                    // 2) 실제 메시지 전송 패킷 발송 (로그에서 추출한 순정 규격)
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // 4. 에러 패킷 감지 (44)
                if (raw.startsWith('44/v3/chats')) {
                    clearTimeout(timeoutTimer);
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: `서버 인증/요청 거부: ${raw}`
                    }, '*');
                    ws.close();
                    return;
                }

                // 5. 서버 확인 응답(Ack: 43) 수신 시 화면에 실시간 표시
                if (raw.startsWith('43/v3/chats')) {
                    sendStatus('📡 [서버 접수 완료] AI 답변 생성 대기 중...');
                    return;
                }

                // 6. 실시간 이벤트 수신 (42/v3/chats 또는 42로 시작하는 모든 이벤트)
                if (raw.includes('characterMessageGenerating') || raw.includes('characterMessageGenerated')) {
                    receivedChunk = true;
                    clearTimeout(timeoutTimer);

                    try {
                        const jsonStartIndex = raw.indexOf('[');
                        if (jsonStartIndex !== -1) {
                            const [eventName, payload] = JSON.parse(raw.slice(jsonStartIndex));

                            if (eventName === 'characterMessageGenerating') {
                                const chunk = payload?.data?.chunk || '';
                                window.postMessage({
                                    source: 'PASTEL_CRACK_SOCKET_CHUNK',
                                    reqId: reqId,
                                    text: chunk
                                }, '*');
                            } else if (eventName === 'characterMessageGenerated') {
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
                        }
                    } catch (err) {
                        console.warn('[PASTEL-WS] 파싱 오류:', err, raw);
                    }
                    return;
                }

                // 기타 서버 수신 패킷이 있을 경우 화면에 상태 표시
                if (!receivedChunk && raw.length > 3) {
                    sendStatus(`📨 서버 응답 수신: ${raw.slice(0, 45)}...`);
                }
            };

            ws.onerror = (err) => {
                clearTimeout(timeoutTimer);
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: '웹소켓 네트워크 오류'
                }, '*');
            };

            ws.onclose = () => {
                clearTimeout(timeoutTimer);
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
