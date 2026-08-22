// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.0.2
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

    // 1. 크랙 사이트 접속 시 최신 access_token 및 실제 전송 패킷(Fetch/XHR/WS) 자동 스니퍼
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

        // [스니퍼 A] window.fetch 후킹
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const [resource, config] = args;
                const url = typeof resource === 'string' ? resource : resource?.url || '';
                const method = (config?.method || (typeof resource === 'object' ? resource?.method : 'GET') || 'GET').toUpperCase();
                
                if (method === 'POST' && (url.includes('chat') || url.includes('message') || url.includes('generate') || url.includes('episode'))) {
                    GM_setValue('crack_sniffed_send_url', url);
                    if (config?.headers) {
                        const h = {};
                        if (config.headers instanceof Headers) {
                            config.headers.forEach((val, key) => { h[key] = val; });
                        } else if (typeof config.headers === 'object') {
                            Object.assign(h, config.headers);
                        }
                        GM_setValue('crack_sniffed_headers', JSON.stringify(h));
                    }
                    if (config?.body && typeof config.body === 'string') {
                        GM_setValue('crack_sniffed_body_sample', config.body);
                    }
                }
            } catch (_) {}
            return originalFetch.apply(this, args);
        };

        // [스니퍼 B] XMLHttpRequest 후킹
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._sniffMethod = method;
            this._sniffUrl = url;
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            try {
                const method = (this._sniffMethod || '').toUpperCase();
                const url = this._sniffUrl || '';
                if (method === 'POST' && (url.includes('chat') || url.includes('message') || url.includes('generate') || url.includes('episode'))) {
                    GM_setValue('crack_sniffed_send_url', url);
                    if (typeof body === 'string') {
                        GM_setValue('crack_sniffed_body_sample', body);
                    }
                }
            } catch (_) {}
            return origSend.apply(this, arguments);
        };

        // [스니퍼 C] WebSocket 후킹
        const OrigWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new OrigWebSocket(url, protocols);
            try {
                GM_setValue('crack_sniffed_ws_url', url);
                const origWsSend = ws.send;
                ws.send = function(data) {
                    try {
                        if (typeof data === 'string' && (data.includes('message') || data.includes('chat') || data.includes('content'))) {
                            GM_setValue('crack_sniffed_ws_payload', data);
                        }
                    } catch (_) {}
                    return origWsSend.apply(this, arguments);
                };
            } catch (_) {}
            return ws;
        };
        return;
    }

    // 2. crack.html 페이지 통신 중계 리스너
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // 스니퍼 캐시 조회 요청 응답
        if (event.data.source === 'PASTEL_CRACK_GET_SNIFFED_CONFIG') {
            window.postMessage({
                source: 'PASTEL_CRACK_SNIFFED_CONFIG_RES',
                sendUrl: GM_getValue('crack_sniffed_send_url', ''),
                headers: GM_getValue('crack_sniffed_headers', '{}'),
                bodySample: GM_getValue('crack_sniffed_body_sample', ''),
                wsUrl: GM_getValue('crack_sniffed_ws_url', ''),
                wsPayload: GM_getValue('crack_sniffed_ws_payload', ''),
                token: GM_getValue('crack_access_token', '')
            }, '*');
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
