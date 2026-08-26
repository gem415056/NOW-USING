// ==UserScript==
// @name         PASTELchat Crack API & Socket.IO Direct Bridge
// @namespace    https://github.com/
// @version      5.0.0
// @description  Invisible Native Tunnel Engine for PASTELchat (100% Cookie & 403 Bypass)
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

    const isCrackDomain = location.hostname.includes('wrtn.ai');
    const isInsideIframe = window.self !== window.top;

    // =========================================================================
    // [1. 투명 터널(크랙 내부)에서 실행되는 공식 소켓 중계기]
    // =========================================================================
    if (isCrackDomain && isInsideIframe) {
        console.log('[PASTEL-TUNNEL] 투명 크랙 정식 터널 가동 완료');

        let activeTunnelWS = null;

        window.addEventListener('message', (e) => {
            if (!e.data || e.data.source !== 'PASTEL_TUNNEL_DISPATCH') return;

            const { reqId, chatId, message, token } = e.data;

            const postToParent = (source, payload) => {
                window.parent.postMessage(Object.assign({ source: source, reqId: reqId }, payload), '*');
            };

            postToParent('PASTEL_CRACK_STATUS_LOG', { text: '🔄 [공식 터널] 크랙 내부 정식 소켓 접속 중...' });

            const wsUrl = 'wss://crack-api.wrtn.ai:443/character-chat/socket.io/?EIO=4&transport=websocket';
            let ws = null;
            let sendTime = 0;

            try {
                ws = new WebSocket(wsUrl);
            } catch (err) {
                postToParent('PASTEL_CRACK_SOCKET_ERROR', { error: `터널 소켓 에러: ${err.message}` });
                return;
            }

            ws.onmessage = (ev) => {
                const raw = ev.data;
                if (typeof raw !== 'string') return;

                if (raw === '2') { ws.send('3'); return; }

                // 0: 핸드셰이크 수신 -> 네임스페이스 진입
                if (raw.startsWith('0')) {
                    postToParent('PASTEL_CRACK_STATUS_LOG', { text: '🔄 [공식 터널] /v3/chats 정식 인증 승인 중...' });
                    const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
                    const authPacket = cleanToken ? `40/v3/chats,{"token":"Bearer ${cleanToken}"}` : '40/v3/chats,';
                    ws.send(authPacket);
                    return;
                }

                // 40: 공식 인증 승인 완료 -> 발사!
                if (raw.startsWith('40/v3/chats')) {
                    sendTime = Date.now();
                    postToParent('PASTEL_CRACK_STATUS_LOG', { text: '🚀 [공식 터널] 메시지 전송 성공! AI 답변 생성 대기 중...' });
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // 42: 실시간 응답 수신
                if (sendTime > 0) {
                    if (raw.includes('characterMessageGenerating')) {
                        try {
                            const jsonStartIndex = raw.indexOf('[');
                            if (jsonStartIndex !== -1) {
                                const [eventName, payload] = JSON.parse(raw.slice(jsonStartIndex));
                                postToParent('PASTEL_CRACK_SOCKET_CHUNK', { text: payload?.data?.chunk || '' });
                            }
                        } catch (_) {}
                        return;
                    }

                    if (raw.includes('characterMessageGenerated')) {
                        try {
                            const jsonStartIndex = raw.indexOf('[');
                            if (jsonStartIndex !== -1) {
                                const [eventName, payload] = JSON.parse(raw.slice(jsonStartIndex));
                                postToParent('PASTEL_CRACK_SOCKET_DONE', {
                                    text: payload?.data?.content || '',
                                    cashUsed: payload?.data?.cashUsage?.total || 0
                                });
                                ws.close();
                            }
                        } catch (_) {}
                        return;
                    }

                    if (raw.startsWith('43/v3/chats') || raw.startsWith('44/v3/chats')) {
                        try {
                            const jsonPart = raw.replace(/^4[34]\/v3\/chats,\d*/, '');
                            const ackData = JSON.parse(jsonPart);
                            const errObj = ackData?.error || (Array.isArray(ackData) ? ackData[0]?.error : null);
                            if (errObj && errObj.statusCode >= 400) {
                                postToParent('PASTEL_CRACK_SOCKET_ERROR', { error: `서버 거부 (${errObj.statusCode}): ${errObj.message || '인증 실패'}` });
                                ws.close();
                                return;
                            }
                        } catch (_) {}
                    }
                }
            };

            ws.onerror = (err) => {
                postToParent('PASTEL_CRACK_SOCKET_ERROR', { error: '크랙 공식 터널 연결 오류' });
            };
        });

        return;
    }

    // =========================================================================
    // [2. crack.wrtn.ai 공식 사이트 최상위 창: 토큰 자동 캐싱]
    // =========================================================================
    if (isCrackDomain && !isInsideIframe) {
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
    // [3. crack.html 메인 화면: 투명 터널 자동 소환 및 통신 브릿지]
    // =========================================================================
    let tunnelIframe = null;

    function getOrCreateTunnel() {
        if (tunnelIframe && document.body.contains(tunnelIframe)) return tunnelIframe;
        tunnelIframe = document.createElement('iframe');
        tunnelIframe.id = 'pastel-crack-native-tunnel';
        tunnelIframe.src = 'https://crack.wrtn.ai/';
        tunnelIframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;border:none;';
        (document.body || document.documentElement).appendChild(tunnelIframe);
        return tunnelIframe;
    }

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(getOrCreateTunnel, 1000);
    });

    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [A] 채팅 전송 요청 -> 투명 터널로 위임
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const tunnel = getOrCreateTunnel();
            const cachedToken = GM_getValue('crack_access_token', '');

            const sendToTunnel = () => {
                tunnel.contentWindow.postMessage({
                    source: 'PASTEL_TUNNEL_DISPATCH',
                    reqId: reqId,
                    chatId: chatId,
                    message: message,
                    token: cachedToken
                }, '*');
            };

            // 터널 로딩 확인 후 발송
            if (tunnel.contentWindow) {
                sendToTunnel();
            } else {
                tunnel.onload = sendToTunnel;
            }
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
