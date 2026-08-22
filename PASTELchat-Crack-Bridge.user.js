// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.2.1
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

    // 2. crack.html 독립형 하이브리드 전송 브릿지
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [독립형 소켓/REST 전송 엔진]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const token = GM_getValue('crack_access_token', '');

            const sendLog = (msg) => {
                window.postMessage({ source: 'PASTEL_CRACK_STATUS_LOG', reqId, text: msg }, '*');
            };

            if (!token) {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '⚠️ 로그인 토큰이 없습니다. 동일한 브라우저 탭에서 crack.wrtn.ai에 먼저 접속해 주세요.' }, '*');
                return;
            }

            sendLog('🔑 [1/4] 로그인 토큰 확인 완료 (Bearer)');

            let accumulatedText = '';
            let isCompleted = false;

            // 1단계: WebSocket 직접 연결 시도
            sendLog('🌐 [2/4] 크랙 소켓 서버 연결 시도 중...');
            
            let wsUrl = `wss://crack-api.wrtn.ai/character-chat/socket.io/?EIO=4&transport=websocket&token=${encodeURIComponent(token)}&auth%5Btoken%5D=Bearer%20${encodeURIComponent(token)}`;
            let ws = null;
            let wsConnected = false;

            try {
                ws = new WebSocket(wsUrl);
            } catch (err) {
                sendLog('⚠️ 소켓 생성 실패: ' + err.message);
            }

            if (ws) {
                ws.onopen = () => {
                    sendLog('🤝 [3/4] 소켓 연결 수립 완료');
                };

                ws.onmessage = (msgEvent) => {
                    const raw = String(msgEvent.data || '');

                    // Engine.IO 핸드셰이크 수신 -> 네임스페이스 접속
                    if (raw.startsWith('0')) {
                        wsConnected = true;
                        sendLog('📡 네임스페이스(/v3/chats) 인증 접속 요청...');
                        ws.send(`40/v3/chats,${JSON.stringify({ auth: { token: `Bearer ${token}` } })}`);
                        return;
                    }

                    // 네임스페이스 접속 완료 -> 대화 메시지 send 패킷 발송
                    if (raw.startsWith('40/v3/chats')) {
                        const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                        sendLog('💬 [4/4] 메시지 발송 완료! AI 답변 대기 중...');
                        ws.send(sendPayload);
                        return;
                    }

                    // 핑/퐁 응답
                    if (raw === '2') {
                        ws.send('3');
                        return;
                    }

                    // 스트리밍 토큰 및 완료 패킷 수신
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
                                    ws.close();
                                }

                                if (evtName === 'error') {
                                    sendLog('⚠️ 소켓 에러 이벤트: ' + (evtData?.message || '알 수 없는 오류'));
                                }
                            }
                        } catch (_) {}
                    }
                };

                ws.onerror = (e) => {
                    sendLog('⚠️ 소켓 통신 오류 감지');
                };

                ws.onclose = () => {
                    if (!isCompleted && accumulatedText) {
                        isCompleted = true;
                        window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: accumulatedText }, '*');
                    }
                };
            }

            // 2단계: 8초 동안 소켓 응답이 없으면 정밀 REST API로 자동 전환 (폴백)
            setTimeout(async () => {
                if (isCompleted || accumulatedText || wsConnected) return;

                sendLog('🔄 소켓 응답 지연 -> REST 보안 우회 전송으로 자동 전환 중...');
                if (ws) try { ws.close(); } catch(_) {}

                try {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages`,
                        headers: {
                            'Origin': 'https://crack.wrtn.ai',
                            'Referer': 'https://crack.wrtn.ai/',
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'platform': 'web',
                            'wrtn-locale': 'ko-KR',
                            'x-wrtn-id': 'W2.2.7ee13701.b310.4f07.a89b.36d023805b50'
                        },
                        data: JSON.stringify({ message: message, content: message }),
                        withCredentials: true,
                        timeout: 120000,
                        onload: (res) => {
                            let parsed = res.responseText;
                            try { parsed = JSON.parse(res.responseText); } catch(_) {}
                            const reply = parsed?.data?.content || parsed?.data?.message || parsed?.content || parsed?.message || res.responseText;
                            if (res.status === 200 || res.status === 201) {
                                isCompleted = true;
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: reply }, '*');
                            } else {
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: `서버 응답 오류 (HTTP ${res.status}): ${res.responseText.slice(0, 150)}` }, '*');
                            }
                        },
                        onerror: (err) => {
                            window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: 'REST 통신 실패: ' + (err.error || 'Network Error') }, '*');
                        }
                    });
                } catch (restErr) {
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: 'REST 전송 오류: ' + restErr.message }, '*');
                }
            }, 8000);

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
