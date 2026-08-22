// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.2.4
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
// @author       Gemini
// @match        *://*/*crack.html*
// @match        https://crack.wrtn.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 1. 크랙 사이트 접속 시 최신 access_token 자동 포착
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

    // 2. crack.html 독립 소켓 통신 브릿지
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [독립 소켓 직통 전송 엔진]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const token = GM_getValue('crack_access_token', '');

            const sendLog = (msg) => {
                window.postMessage({ source: 'PASTEL_CRACK_STATUS_LOG', reqId, text: msg }, '*');
            };

            if (!token) {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '⚠️ 로그인 토큰이 없습니다. crack.wrtn.ai를 먼저 새로고침해 주세요.' }, '*');
                return;
            }

            sendLog('🔑 [1/4] 로그인 토큰 확인 완료');

            let accumulatedText = '';
            let isCompleted = false;
            let pingTimer = null;

            // 크랙 소켓 URL 연결 (토큰 파라미터 포함)
            const wsUrl = `wss://crack-api.wrtn.ai/character-chat/socket.io/?EIO=4&transport=websocket&token=${encodeURIComponent(token)}`;
            sendLog('🌐 [2/4] 크랙 소켓 서버 연결 시도 중...');

            let ws = null;
            try {
                ws = new WebSocket(wsUrl);
            } catch (err) {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '소켓 생성 실패: ' + err.message }, '*');
                return;
            }

            ws.onopen = () => {
                sendLog('🤝 소켓 연결 성공 -> 핸드셰이크 대기 중...');
            };

            ws.onmessage = (msgEvent) => {
                const raw = String(msgEvent.data || '');

                // 1) Engine.IO 핸드셰이크 수신 (0) -> 핑퐁 시작 & 네임스페이스 접속 요청 (40)
                if (raw.startsWith('0')) {
                    try {
                        const hs = JSON.parse(raw.slice(1));
                        const interval = hs.pingInterval || 25000;
                        pingTimer = setInterval(() => {
                            if (ws && ws.readyState === WebSocket.OPEN) ws.send('3');
                        }, interval);
                    } catch (_) {}

                    sendLog('📡 [3/4] 네임스페이스(/v3/chats) 접속 요청 발송...');
                    ws.send('40/v3/chats,');
                    return;
                }

                // 2) 네임스페이스 승인 수신 (40) -> 승인 확인 즉시 대화 메시지 발송!
                if (raw.startsWith('40/v3/chats')) {
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    ws.send(sendPayload);
                    sendLog('💬 [4/4] 메시지 발송 완료! AI 실시간 답변 수신 대기 중...');
                    return;
                }

                // 3) 네임스페이스 거절 (44)
                if (raw.startsWith('44/v3/chats')) {
                    sendLog(`⚠️ 네임스페이스 거절 신호 수신: ${raw}`);
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: `인증 거절 (44): ${raw}` }, '*');
                    return;
                }

                // 4) 핑 수신 시 퐁 응답
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 5) 대화 스트리밍 수신 (42, 43)
                if (raw.startsWith('42/v3/chats,') || raw.startsWith('43/v3/chats,')) {
                    try {
                        const jsonStr = raw.replace(/^4[23]\/v3\/chats,(\d+)?/, '');
                        const parsed = JSON.parse(jsonStr);

                        if (Array.isArray(parsed)) {
                            const [evtName, evtData] = parsed;
                            let piece = '';
                            if (typeof evtData === 'string') piece = evtData;
                            else if (evtData && typeof evtData === 'object') {
                                piece = evtData.content || evtData.message || evtData.text || evtData.chunk || evtData.data?.content || evtData.data?.message || '';
                            }

                            if (piece) {
                                if (piece.length > accumulatedText.length && piece.startsWith(accumulatedText.slice(0, 10))) {
                                    accumulatedText = piece;
                                } else if (!accumulatedText.includes(piece)) {
                                    accumulatedText += piece;
                                }
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_CHUNK', reqId, text: accumulatedText }, '*');
                            }

                            if (evtName === 'done' || evtName === 'end' || evtName === 'finish' || evtName === 'complete') {
                                isCompleted = true;
                                const finalTxt = evtData?.content || evtData?.message || accumulatedText;
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: finalTxt }, '*');
                                if (pingTimer) clearInterval(pingTimer);
                                ws.close();
                            }

                            if (evtName === 'error') {
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: evtData?.message || '소켓 에러' }, '*');
                                if (pingTimer) clearInterval(pingTimer);
                                ws.close();
                            }
                        }
                    } catch (_) {}
                }
            };

            ws.onerror = (e) => {
                sendLog('⚠️ 소켓 통신 에러 발생');
            };

            ws.onclose = () => {
                if (pingTimer) clearInterval(pingTimer);
                if (!isCompleted && accumulatedText) {
                    isCompleted = true;
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
