// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.2.3
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

    // =========================================================================
    // [A. crack.wrtn.ai 탭: 쿠키 탑재 정품 소켓 상시 연결 및 원격 실행 서버]
    // =========================================================================
    if (location.hostname.includes('wrtn.ai')) {
        let authSocket = null;
        let isConnecting = false;
        let accumulatedChunk = '';
        let currentReqId = null;

        // 쿠키 토큰 갱신
        const syncToken = () => {
            const cookies = document.cookie.split(';');
            for (let c of cookies) {
                const [k, v] = c.trim().split('=');
                if (k === 'access_token' && v) {
                    GM_setValue('crack_access_token', decodeURIComponent(v));
                }
            }
        };
        syncToken();
        setInterval(syncToken, 3000);

        // 정품 소켓 생성 및 상시 연결 유지
        const connectAuthSocket = () => {
            if (authSocket && (authSocket.readyState === WebSocket.OPEN || authSocket.readyState === WebSocket.CONNECTING)) return;
            isConnecting = true;

            const wsUrl = 'wss://crack-api.wrtn.ai/character-chat/socket.io/?EIO=4&transport=websocket';
            authSocket = new WebSocket(wsUrl);

            authSocket.onopen = () => {
                isConnecting = false;
            };

            authSocket.onmessage = (msgEvt) => {
                const raw = String(msgEvt.data || '');

                // 1) 핸드셰이크 수신 -> 네임스페이스 접속
                if (raw.startsWith('0')) {
                    authSocket.send('40/v3/chats,');
                    return;
                }

                // 2) 핑 수신 -> 퐁 응답
                if (raw === '2') {
                    authSocket.send('3');
                    return;
                }

                // 3) 대화 답변 스트리밍 수신
                if (raw.startsWith('42/v3/chats,') || raw.startsWith('43/v3/chats,')) {
                    try {
                        const jsonStr = raw.replace(/^4[23]\/v3\/chats,(\d+)?/, '');
                        const parsed = JSON.parse(jsonStr);
                        if (Array.isArray(parsed) && currentReqId) {
                            const [evtName, evtData] = parsed;
                            let piece = '';
                            if (typeof evtData === 'string') piece = evtData;
                            else if (evtData && typeof evtData === 'object') {
                                piece = evtData.content || evtData.message || evtData.text || evtData.chunk || evtData.data?.content || evtData.data?.message || '';
                            }

                            if (piece) {
                                if (piece.length > accumulatedChunk.length && piece.startsWith(accumulatedChunk.slice(0, 10))) {
                                    accumulatedChunk = piece;
                                } else if (!accumulatedChunk.includes(piece)) {
                                    accumulatedChunk += piece;
                                }
                                GM_setValue('pastel_dispatch_response', { reqId: currentReqId, type: 'chunk', text: accumulatedChunk, t: Date.now() });
                            }

                            if (evtName === 'done' || evtName === 'end' || evtName === 'finish' || evtName === 'complete') {
                                const finalTxt = evtData?.content || evtData?.message || accumulatedChunk;
                                GM_setValue('pastel_dispatch_response', { reqId: currentReqId, type: 'done', text: finalTxt, t: Date.now() });
                                currentReqId = null;
                            }

                            if (evtName === 'error') {
                                GM_setValue('pastel_dispatch_response', { reqId: currentReqId, type: 'error', error: evtData?.message || '소켓 에러', t: Date.now() });
                                currentReqId = null;
                            }
                        }
                    } catch (_) {}
                }
            };

            authSocket.onclose = () => {
                isConnecting = false;
                setTimeout(connectAuthSocket, 2000);
            };

            authSocket.onerror = () => {
                isConnecting = false;
            };
        };

        connectAuthSocket();

        // crack.html의 발송 요청 감지 -> 정품 소켓으로 전송
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener('pastel_dispatch_send', (name, oldVal, newVal) => {
                if (!newVal || !newVal.reqId) return;
                const { reqId, chatId, message } = newVal;
                currentReqId = reqId;
                accumulatedChunk = '';

                const sendMsg = () => {
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    authSocket.send(sendPayload);
                    GM_setValue('pastel_dispatch_response', { reqId: reqId, type: 'status', text: '💬 [3/3] 크랙 공식 소켓으로 전송 완료! AI 답변 수신 중...', t: Date.now() });
                };

                if (authSocket && authSocket.readyState === WebSocket.OPEN) {
                    sendMsg();
                } else {
                    connectAuthSocket();
                    setTimeout(() => {
                        if (authSocket && authSocket.readyState === WebSocket.OPEN) {
                            sendMsg();
                        } else {
                            GM_setValue('pastel_dispatch_response', { reqId: reqId, type: 'error', error: '⚠️ 크랙 탭의 소켓 연결 대기 중입니다. 잠시 후 다시 시도해 주세요.', t: Date.now() });
                        }
                    }, 1500);
                }
            });
        }
        return;
    }

    // =========================================================================
    // [B. crack.html 탭: 릴레이 발신 클라이언트]
    // =========================================================================
    if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('pastel_dispatch_response', (name, oldVal, newVal) => {
            if (!newVal || !newVal.reqId) return;
            if (newVal.type === 'status') {
                window.postMessage({ source: 'PASTEL_CRACK_STATUS_LOG', reqId: newVal.reqId, text: newVal.text }, '*');
            } else if (newVal.type === 'chunk') {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_CHUNK', reqId: newVal.reqId, text: newVal.text }, '*');
            } else if (newVal.type === 'done') {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId: newVal.reqId, text: newVal.text }, '*');
            } else if (newVal.type === 'error') {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId: newVal.reqId, error: newVal.error }, '*');
            }
        });
    }

    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [소켓 릴레이 발송 요청]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            window.postMessage({ source: 'PASTEL_CRACK_STATUS_LOG', reqId: reqId, text: '📡 [1/3] 크랙 공식 탭으로 메시지 전달 중...' }, '*');

            GM_setValue('pastel_dispatch_send', {
                reqId: reqId,
                chatId: chatId,
                message: message,
                t: Date.now()
            });
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
