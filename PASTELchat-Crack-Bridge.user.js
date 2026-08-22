// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.2.0
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
    // [A. crack.wrtn.ai 탭에서 실행되는 소켓 원격 조종 릴레이 수신 서버]
    // =========================================================================
    if (location.hostname.includes('wrtn.ai')) {
        let liveCrackSocket = null;
        let accumulatedChunk = '';
        let currentActiveReqId = null;

        // 쿠키 토큰 자동 저장
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

        // 공식 소켓 인스턴스 가로채서 보관
        const origWsSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function(data) {
            if (this.url && this.url.includes('character-chat/socket.io')) {
                liveCrackSocket = this;
                if (!this._hasRelayListener) {
                    this._hasRelayListener = true;
                    this.addEventListener('message', (ev) => {
                        const raw = String(ev.data || '');
                        if (!currentActiveReqId) return;

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
                                        if (piece.length > accumulatedChunk.length && piece.startsWith(accumulatedChunk.slice(0, 10))) {
                                            accumulatedChunk = piece;
                                        } else if (!accumulatedChunk.includes(piece)) {
                                            accumulatedChunk += piece;
                                        }
                                        GM_setValue('pastel_relay_stream_event', { reqId: currentActiveReqId, type: 'chunk', text: accumulatedChunk, t: Date.now() });
                                    }

                                    if (evtName === 'done' || evtName === 'end' || evtName === 'finish' || evtName === 'complete') {
                                        const finalTxt = evtData?.content || evtData?.message || accumulatedChunk;
                                        GM_setValue('pastel_relay_stream_event', { reqId: currentActiveReqId, type: 'done', text: finalTxt, t: Date.now() });
                                        currentActiveReqId = null;
                                    }

                                    if (evtName === 'error') {
                                        GM_setValue('pastel_relay_stream_event', { reqId: currentActiveReqId, type: 'error', error: evtData?.message || '소켓 에러', t: Date.now() });
                                        currentActiveReqId = null;
                                    }
                                }
                            } catch (_) {}
                        }
                    });
                }
            }
            return origWsSend.apply(this, arguments);
        };

        // crack.html에서 전송 신호가 오면 공식 소켓으로 발송
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener('pastel_relay_send_dispatch', (name, oldVal, newVal) => {
                if (!newVal || !newVal.reqId) return;
                const { reqId, chatId, message } = newVal;
                currentActiveReqId = reqId;
                accumulatedChunk = '';

                if (liveCrackSocket && liveCrackSocket.readyState === WebSocket.OPEN) {
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    liveCrackSocket.send(sendPayload);
                } else {
                    GM_setValue('pastel_relay_stream_event', {
                        reqId: reqId,
                        type: 'error',
                        error: '⚠️ 크랙 탭의 소켓이 아직 연결되지 않았습니다. crack.wrtn.ai 탭을 새로고침해 주세요.',
                        t: Date.now()
                    });
                }
            });
        }
        return;
    }

    // =========================================================================
    // [B. crack.html 탭에서 실행되는 릴레이 발신 클라이언트]
    // =========================================================================
    if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('pastel_relay_stream_event', (name, oldVal, newVal) => {
            if (!newVal || !newVal.reqId) return;
            if (newVal.type === 'chunk') {
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

        // [소켓 릴레이 발신]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            GM_setValue('pastel_relay_send_dispatch', {
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
