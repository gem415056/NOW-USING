// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      4.3.0
// @description  403 Forbidden Bypass & Complete Multi-Key Auth for PASTELchat
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
                const tokenKeys = ['access_token', 'accessToken', 'wrtn_token', 'token', 'refreshToken'];
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
    // [2. crack.html 통신 브릿지 (v4.3.0 403 우회 다중 인증 엔진)]
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

            const rawToken = GM_getValue('crack_access_token', '');
            const cleanToken = rawToken.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
            const cachedWId = GM_getValue('crack_w_id', 'W2.2.ba1dca25.315c.4cf1.acd3.28b9c450e340');

            sendStatus('🔄 [1/3] 소켓 보안 인증 터널 개설 중...');

            // 소켓 URL에 크랙 정식 헤더 쿼리 전부 탑재
            let wsUrl = `wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket&platform=web&wrtn-locale=ko-KR&x-wrtn-id=${encodeURIComponent(cachedWId)}`;
            if (cleanToken) {
                wsUrl += `&token=Bearer%20${encodeURIComponent(cleanToken)}&accessToken=${encodeURIComponent(cleanToken)}`;
            }

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

            timeoutTimer = setTimeout(() => {
                if (ws && !hasReceivedResponsePacket) {
                    ws.close();
                    window.postMessage({
                        source: 'PASTEL_CRACK_SOCKET_ERROR',
                        reqId: reqId,
                        error: '메시지 발송 후 60초 동안 응답이 없습니다.'
                    }, '*');
                }
            }, 60000);

            ws.onopen = () => {};

            ws.onmessage = (e) => {
                const raw = e.data;
                if (typeof raw !== 'string') return;

                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // [단계 1] 핸드셰이크 (0) -> 복합 다중 인증 페이로드 발송 (403 원천 차단)
                if (raw.startsWith('0')) {
                    sendStatus('🔄 [2/3] 다중 보안 토큰 인증 승인 대기...');

                    const authPayload = {
                        token: `Bearer ${cleanToken}`,
                        accessToken: cleanToken,
                        authorization: `Bearer ${cleanToken}`
                    };

                    ws.send(`40/v3/chats,${JSON.stringify(authPayload)}`);
                    return;
                }

                // [단계 2] 네임스페이스 승인 (40/v3/chats) -> 송신(SEND) 발사!
                if (raw.startsWith('40/v3/chats')) {
                    sendTime = Date.now();
                    sendStatus('🚀 [3/3] 인증 통과! 메시지 전송 발사...');

                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // [단계 3] 송신 이후 패킷 수신
                if (sendTime > 0) {
                    // 1. 실시간 텍스트 생성 수신
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

                    // 2. 최종 완료 수신
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

                    // 3. 만약 43 Ack에서 에러가 온 경우 (전문 전체 파싱)
                    if (raw.startsWith('43/v3/chats') || raw.startsWith('44/v3/chats')) {
                        try {
                            const jsonPart = raw.replace(/^4[34]\/v3\/chats,\d*/, '');
                            const ackData = JSON.parse(jsonPart);
                            const errObj = ackData?.error || (Array.isArray(ackData) ? ackData[0]?.error : null) || ackData;

                            if (errObj && (errObj.statusCode || errObj.message)) {
                                clearTimeout(timeoutTimer);
                                const fullMsg = errObj.message ? (Array.isArray(errObj.message) ? errObj.message.join(', ') : errObj.message) : JSON.stringify(errObj);
                                window.postMessage({
                                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                                    reqId: reqId,
                                    error: `서버 거부 (${errObj.statusCode || 'Err'}): ${fullMsg}`
                                }, '*');
                                ws.close();
                                return;
                            }
                        } catch (_) {}
                    }

                    // 4. 기타 수신 패킷 모니터링
                    if (!hasReceivedResponsePacket && raw !== '3') {
                        const elapsed = ((Date.now() - sendTime) / 1000).toFixed(1);
                        sendStatus(`📨 [수신 감지 ${elapsed}s] ${raw.slice(0, 70)}`);
                    }
                }
            };

            ws.onerror = (err) => {
                clearTimeout(timeoutTimer);
                window.postMessage({
                    source: 'PASTEL_CRACK_SOCKET_ERROR',
                    reqId: reqId,
                    error: '웹소켓 연결 오류'
                }, '*');
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
