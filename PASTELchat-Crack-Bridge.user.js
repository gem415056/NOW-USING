// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      3.6.0
// @description  Direct WebSocket streaming and REST API bridge with visual diagnostics for PASTELchat crack.html
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
    // [2. crack.html 통신 브릿지 (Socket.IO 웹소켓 직통 & 실시간 화면 진단)]
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

            sendStatus('🔄 [1/4] 크랙 웹소켓 서버 접속 시도 중...');

            // URL 쿼리에 토큰 파라미터 직접 추가 (CORS 및 인증 통과율 극대화)
            let wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
            if (cleanToken) {
                wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}`;
            }

            let ws = null;
            let timeoutTimer = null;

            try {
                ws = new WebSocket(wsUrl);
            } catch (e) {
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: `웹소켓 생성 실패: ${e.message}`
                }, '*');
                return;
            }

            // 15초 타임아웃 감시
            timeoutTimer = setTimeout(() => {
                if (ws) ws.close();
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: '서버 응답 시간 초과 (15초간 반응 없음)'
                }, '*');
            }, 15000);

            ws.onopen = () => {
                sendStatus('🔄 [2/4] 소켓 연결 성공, 핸드셰이크 대기 중...');
            };

            ws.onmessage = (e) => {
                const raw = e.data;
                if (typeof raw !== 'string') return;

                // Ping/Pong
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 1. 초기 연결 수신 (0으로 시작)
                if (raw.startsWith('0')) {
                    sendStatus('🔄 [3/4] /v3/chats 네임스페이스 인증 요청 중...');
                    const authPacket = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                    ws.send(authPacket);
                    return;
                }

                // 2. /v3/chats 네임스페이스 승인 완료 (40/v3/chats 수신)
                if (raw.startsWith('40/v3/chats')) {
                    sendStatus('🚀 [4/4] 인증 완료! 메시지 전송 중...');
                    // 실제 전송 패킷 발송 (시퀀스 번호 1 명시)
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // 3. 서버 거부/에러 발생 (44/v3/chats 수신)
                if (raw.startsWith('44/v3/chats')) {
                    clearTimeout(timeoutTimer);
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: `서버 인증 거부 (44): ${raw}`
                    }, '*');
                    ws.close();
                    return;
                }

                // 4. 실시간 이벤트 수신 (42/v3/chats,...)
                if (raw.startsWith('42/v3/chats,')) {
                    clearTimeout(timeoutTimer); // 응답 오기 시작하면 타임아웃 해제
                    try {
                        const jsonStr = raw.replace(/^42\/v3\/chats,\d*/, '');
                        const [eventName, payload] = JSON.parse(jsonStr);

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
                            ws.close(); // 완료 후 소켓 정리
                        }
                    } catch (err) {
                        console.warn('[PASTEL-WS] JSON 파싱 에러:', err, raw);
                    }
                }
            };

            ws.onerror = (err) => {
                clearTimeout(timeoutTimer);
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: '웹소켓 네트워크 연결 실패 (Origin 차단 또는 서버 다운)'
                }, '*');
            };

            ws.onclose = (ev) => {
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
