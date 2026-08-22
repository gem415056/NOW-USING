// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.1.0
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
// @author       PASTELchat
// @match        *://*/*crack.html*
// @match        https://crack.wrtn.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 1. 크랙 사이트 접속 시 최신 access_token 자동 포착 및 동기화
    if (location.hostname.includes('wrtn.ai')) {
        const checkToken = () => {
            const cookies = document.cookie.split(';');
            for (let c of cookies) {
                const [k, v] = c.trim().split('=');
                if (k === 'access_token' && v) {
                    GM_setValue('crack_access_token', decodeURIComponent(v));
                }
            }
        };
        checkToken();
        setInterval(checkToken, 3000);
        return;
    }

    // 2. crack.html 페이지 통신 중계 리스너 (HTTP + Socket.IO 하이브리드 브릿지)
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [소켓 통신 전송 처리기]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const token = GM_getValue('crack_access_token', '');
            
            let wsUrl = 'wss://crack-api.wrtn.ai/character-chat/socket.io/?EIO=4&transport=websocket';
            if (token) {
                wsUrl += `&token=${encodeURIComponent(token)}`;
            }

            let ws = null;
            try {
                ws = new WebSocket(wsUrl);
            } catch (err) {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '웹소켓 생성 실패: ' + err.message }, '*');
                return;
            }

            let pingIntervalTimer = null;
            let accumulatedText = '';

            ws.onopen = () => {};

            ws.onmessage = (msgEvent) => {
                const raw = String(msgEvent.data || '');

                // 1. Engine.IO 핸드셰이크 수신 -> 네임스페이스(/v3/chats) 접속 요청
                if (raw.startsWith('0')) {
                    try {
                        const hs = JSON.parse(raw.slice(1));
                        const interval = hs.pingInterval || 25000;
                        pingIntervalTimer = setInterval(() => {
                            if (ws && ws.readyState === WebSocket.OPEN) ws.send('3');
                        }, interval);
                    } catch (_) {}
                    
                    // 네임스페이스 접속 패킷 발송
                    ws.send('40/v3/chats,');
                    return;
                }

                // 2. 네임스페이스 접속 확인 -> 대화 메시지 send 이벤트 발송
                if (raw.startsWith('40/v3/chats')) {
                    const sendPayload = `42/v3/chats,["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    return;
                }

                // 3. 핑/퐁 유지
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 4. Socket.IO 이벤트 패킷 해독 (42/v3/chats,...)
                if (raw.startsWith('42/v3/chats,')) {
                    try {
                        const jsonStr = raw.slice('42/v3/chats,'.length);
                        const parsed = JSON.parse(jsonStr);
                        if (Array.isArray(parsed) && parsed.length >= 2) {
                            const [evtName, evtData] = parsed;

                            // 스트리밍 토큰 수신 처리
                            if (evtName === 'chunk' || evtName === 'message' || evtName === 'stream') {
                                const content = evtData?.content || evtData?.message || evtData?.chunk || evtData?.text || '';
                                if (content) {
                                    if (content.length > accumulatedText.length && content.startsWith(accumulatedText.slice(0, 10))) {
                                        accumulatedText = content;
                                    } else {
                                        accumulatedText += content;
                                    }
                                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_CHUNK', reqId, text: accumulatedText }, '*');
                                }
                            }

                            // 전송 완료 이벤트 감지
                            if (evtName === 'done' || evtName === 'finish' || evtName === 'end') {
                                const finalText = evtData?.content || evtData?.message || accumulatedText;
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: finalText }, '*');
                                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                                ws.close();
                            }

                            // 에러 이벤트 감지
                            if (evtName === 'error') {
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: evtData?.message || '소켓 에러 발생' }, '*');
                                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                                ws.close();
                            }
                        }
                    } catch (_) {}
                }
            };

            ws.onerror = (e) => {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '웹소켓 통신 에러' }, '*');
            };

            ws.onclose = () => {
                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                // 소켓이 닫혔으나 텍스트가 있으면 완료로 간주
                if (accumulatedText) {
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: accumulatedText }, '*');
                }
            };

            return;
        }

        if (event.data.source !== 'PASTEL_CRACK_REQUEST') return;

        const { reqId, method, url, headers, data, responseType } = event.data;
        const cachedToken = GM_getValue('crack_access_token', '');

        const reqHeaders = Object.assign({}, headers || {});
        if (cachedToken && !reqHeaders['authorization'] && !reqHeaders['Authorization']) {
            reqHeaders['authorization'] = `Bearer ${cachedToken}`;
        }

        const reqTimeout = event.data.timeout || 120000;
        GM_xmlhttpRequest({
            method: method || 'GET',
            url: url,
            headers: reqHeaders,
            data: data,
            timeout: reqTimeout,
            responseType: responseType || 'text',
            withCredentials: true,
            onload: function(res) {
                let parsed = res.responseText;
                try {
                    parsed = JSON.parse(res.responseText);
                } catch (_) {}

                window.postMessage({
                    source: 'PASTEL_CRACK_RESPONSE',
                    reqId: reqId,
                    status: res.status,
                    statusText: res.statusText,
                    data: parsed,
                    rawText: res.responseText
                }, '*');
            },
            ontimeout: function() {
                window.postMessage({
                    source: 'PASTEL_CRACK_RESPONSE',
                    reqId: reqId,
                    status: 408,
                    error: '요청 시간이 초과되었습니다 (Bridge Timeout)'
                }, '*');
            },
            onerror: function(err) {
                window.postMessage({
                    source: 'PASTEL_CRACK_RESPONSE',
                    reqId: reqId,
                    status: 0,
                    error: err.error || 'Network/Bridge Error'
                }, '*');
            }
        });
    });

    // 브릿지 활성화 신호 주입
    window.PASTEL_CRACK_BRIDGE_READY = true;
    document.addEventListener('DOMContentLoaded', () => {
        window.postMessage({ source: 'PASTEL_CRACK_BRIDGE_READY' }, '*');
    });
})();
