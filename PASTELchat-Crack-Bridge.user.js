// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.0.4
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

    // 1. 크랙 사이트 접속 시 access_token 동기화 & 수동 무장형 1회 캡처 엔진
    if (location.hostname.includes('wrtn.ai')) {
        let isCaptureArmed = false;

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

        // 노이즈(잡다한 통신) 필터링 함수
        const isNoiseUrl = (url) => {
            const lower = (url || '').toLowerCase();
            return lower.includes('amplitude') || lower.includes('sentry') || lower.includes('datadog') ||
                   lower.includes('telemetry') || lower.includes('analytics') || lower.includes('log') ||
                   lower.includes('asset') || lower.includes('notification') || lower.includes('banner');
        };

        // 우측 하단 플로팅 캡처 준비 버튼 주입
        const injectTriggerButton = () => {
            if (document.getElementById('pastel-trigger-btn')) return;
            const btn = document.createElement('button');
            btn.id = 'pastel-trigger-btn';
            btn.textContent = '🔴 전송 패킷 1회 캡처';
            btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483646;padding:12px 18px;background:#FF4432;color:#fff;font-weight:bold;font-size:14px;border:2px solid #fff;border-radius:30px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all 0.2s;';
            
            btn.onclick = () => {
                isCaptureArmed = true;
                btn.textContent = '⏳ 전송 대기 중... (채팅을 보내세요)';
                btn.style.background = '#f39c12';
            };
            document.body ? document.body.appendChild(btn) : document.documentElement.appendChild(btn);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectTriggerButton);
        } else {
            injectTriggerButton();
        }

        // 결과 모달 팝업
        const showCaptureModal = (type, details) => {
            isCaptureArmed = false;
            const triggerBtn = document.getElementById('pastel-trigger-btn');
            if (triggerBtn) {
                triggerBtn.textContent = '🔴 전송 패킷 1회 캡처';
                triggerBtn.style.background = '#FF4432';
            }

            let overlay = document.getElementById('pastel-sniff-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pastel-sniff-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;box-sizing:border-box;padding:20px;';
                
                overlay.innerHTML = `
                    <div style="background:#fff;border-radius:14px;width:680px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,0.3);box-sizing:border-box;color:#222;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                            <h3 style="margin:0;font-size:17px;font-weight:bold;color:#2c3e50;">🎯 실제 전송 패킷 포착 성공!</h3>
                            <button id="pastel-sniff-close" style="background:none;border:none;font-size:18px;cursor:pointer;color:#888;font-weight:bold;padding:4px 8px;">✕</button>
                        </div>
                        <p style="margin:0 0 10px 0;font-size:12px;color:#666;">아래 [전체 복사] 버튼을 누른 후, AI에게 그대로 전달해 주시면 즉시 연결을 완료합니다.</p>
                        <textarea id="pastel-sniff-text" style="flex:1;height:320px;min-height:220px;font-family:monospace;font-size:12px;line-height:1.5;padding:12px;border:1px solid #ccc;border-radius:8px;background:#f9f9f9;color:#333;resize:vertical;outline:none;white-space:pre-wrap;box-sizing:border-box;"></textarea>
                        <div style="display:flex;gap:10px;margin-top:14px;">
                            <button id="pastel-sniff-copy" style="flex:1;height:42px;background:#FF4432;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;transition:0.2s;">📋 전체 복사하기</button>
                        </div>
                    </div>
                `;
                document.documentElement.appendChild(overlay);

                document.getElementById('pastel-sniff-close').onclick = () => { overlay.style.display = 'none'; };
                document.getElementById('pastel-sniff-copy').onclick = () => {
                    const ta = document.getElementById('pastel-sniff-text');
                    ta.select();
                    navigator.clipboard.writeText(ta.value);
                    const btn = document.getElementById('pastel-sniff-copy');
                    btn.textContent = '✅ 복사 완료!';
                    btn.style.background = '#27ae60';
                    setTimeout(() => {
                        btn.textContent = '📋 전체 복사하기';
                        btn.style.background = '#FF4432';
                    }, 2000);
                };
            }

            const formatted = `=== [크랙 전송 통신 포착 정보] ===\n[프로토콜]: ${type}\n[요청 URL]: ${details.url || 'N/A'}\n[요청 메소드]: ${details.method || 'POST'}\n\n[헤더 정보]:\n${JSON.stringify(details.headers || {}, null, 2)}\n\n[전송 페이로드 (Body)]:\n${typeof details.body === 'object' ? JSON.stringify(details.body, null, 2) : details.body}\n================================`;

            const ta = document.getElementById('pastel-sniff-text');
            if (ta) ta.value = formatted;
            overlay.style.display = 'flex';
        };

        // [스니퍼 1] Fetch 후킹
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const [resource, config] = args;
                const url = typeof resource === 'string' ? resource : resource?.url || '';
                const method = (config?.method || (typeof resource === 'object' ? resource?.method : 'GET') || 'GET').toUpperCase();
                
                if (isCaptureArmed && !isNoiseUrl(url) && (method === 'POST' || method === 'PUT')) {
                    let parsedBody = config?.body;
                    try { parsedBody = JSON.parse(config.body); } catch (_) {}
                    
                    const h = {};
                    if (config?.headers instanceof Headers) {
                        config.headers.forEach((val, key) => { h[key] = val; });
                    } else if (typeof config?.headers === 'object') {
                        Object.assign(h, config.headers);
                    }

                    showCaptureModal('FETCH (HTTP POST)', { url, method, headers: h, body: parsedBody || config?.body });
                }
            } catch (_) {}
            return originalFetch.apply(this, args);
        };

        // [스니퍼 2] XHR 후킹
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._sniffMethod = method;
            this._sniffUrl = url;
            this._sniffHeaders = {};
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
            if (this._sniffHeaders) this._sniffHeaders[k] = v;
            return origSetHeader.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            try {
                const method = (this._sniffMethod || '').toUpperCase();
                const url = this._sniffUrl || '';
                if (isCaptureArmed && !isNoiseUrl(url) && (method === 'POST' || method === 'PUT')) {
                    let parsedBody = body;
                    try { parsedBody = JSON.parse(body); } catch (_) {}
                    showCaptureModal('XHR (XMLHttpRequest)', { url, method, headers: this._sniffHeaders || {}, body: parsedBody || body });
                }
            } catch (_) {}
            return origSend.apply(this, arguments);
        };

        // [스니퍼 3] WebSocket 후킹
        const OrigWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new OrigWebSocket(url, protocols);
            try {
                const origWsSend = ws.send;
                ws.send = function(data) {
                    try {
                        if (isCaptureArmed) {
                            let parsed = data;
                            try { parsed = JSON.parse(data); } catch (_) {}
                            showCaptureModal('WEBSOCKET (WS)', { url, method: 'WS SEND', headers: { protocol: protocols || 'default' }, body: parsed || data });
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
