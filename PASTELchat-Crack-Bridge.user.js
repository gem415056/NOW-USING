// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.0.6
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

    // 1. 크랙 사이트 접속 시 access_token 동기화 & 타임라인 세션 전수 녹화기
    if (location.hostname.includes('wrtn.ai')) {
        let isRecording = false;
        let recordedPackets = [];
        let recordTimer = null;
        let countdownTimer = null;
        let timeLeft = 10;

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

        // 녹화 시작/종료 제어기
        const startRecording = () => {
            isRecording = true;
            recordedPackets = [];
            timeLeft = 10;
            const btn = document.getElementById('pastel-trigger-btn');
            if (btn) {
                btn.style.background = '#27ae60';
                btn.textContent = `⏹ 녹화 중... (${timeLeft}s)`;
            }

            countdownTimer = setInterval(() => {
                timeLeft--;
                if (btn && isRecording) btn.textContent = `⏹ 녹화 중... (${timeLeft}s)`;
                if (timeLeft <= 0) stopRecording();
            }, 1000);
        };

        const stopRecording = () => {
            if (!isRecording) return;
            isRecording = false;
            if (countdownTimer) clearInterval(countdownTimer);
            if (recordTimer) clearTimeout(recordTimer);

            const btn = document.getElementById('pastel-trigger-btn');
            if (btn) {
                btn.style.background = '#FF4432';
                btn.textContent = '🔴 패킷 녹화 시작';
            }

            showSessionSummaryModal();
        };

        // 플로팅 녹화 버튼 주입
        const injectTriggerButton = () => {
            if (document.getElementById('pastel-trigger-btn')) return;
            const btn = document.createElement('button');
            btn.id = 'pastel-trigger-btn';
            btn.textContent = '🔴 패킷 녹화 시작';
            btn.style.cssText = 'position:fixed;top:70px;right:20px;z-index:2147483646;padding:10px 18px;background:#FF4432;color:#fff;font-weight:bold;font-size:13px;border:2px solid #fff;border-radius:30px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all 0.2s;';
            
            btn.onclick = () => {
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                }
            };
            document.body ? document.body.appendChild(btn) : document.documentElement.appendChild(btn);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectTriggerButton);
        } else {
            injectTriggerButton();
        }

        // 결과 모달 팝업
        const showSessionSummaryModal = () => {
            let overlay = document.getElementById('pastel-sniff-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pastel-sniff-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;box-sizing:border-box;padding:20px;';
                
                overlay.innerHTML = `
                    <div style="background:#fff;border-radius:14px;width:760px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,0.3);box-sizing:border-box;color:#222;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                            <h3 style="margin:0;font-size:17px;font-weight:bold;color:#2c3e50;">📋 세션 패킷 녹화 완료 (${recordedPackets.length}건)</h3>
                            <button id="pastel-sniff-close" style="background:none;border:none;font-size:18px;cursor:pointer;color:#888;font-weight:bold;padding:4px 8px;">✕</button>
                        </div>
                        <p style="margin:0 0 10px 0;font-size:12px;color:#666;">아래 [전체 복사] 버튼을 누른 후, AI에게 그대로 전달해 주시면 실제 채팅 API를 추출합니다.</p>
                        <textarea id="pastel-sniff-text" style="flex:1;height:380px;min-height:260px;font-family:monospace;font-size:11.5px;line-height:1.5;padding:12px;border:1px solid #ccc;border-radius:8px;background:#f9f9f9;color:#333;resize:vertical;outline:none;white-space:pre-wrap;box-sizing:border-box;"></textarea>
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

            let logText = `=== [크랙 세션 통신 전수 기록 (${recordedPackets.length}건)] ===\n\n`;
            if (recordedPackets.length === 0) {
                logText += '(녹화 시간 동안 발생한 통신 패킷이 없습니다.)';
            } else {
                recordedPackets.forEach((p, idx) => {
                    logText += `--------------------------------------------------\n`;
                    logText += `[패킷 #${idx + 1}] ${p.type} | ${p.time}\n`;
                    logText += `[URL/Target]: ${p.url}\n`;
                    if (p.method) logText += `[Method]: ${p.method}\n`;
                    if (p.headers && Object.keys(p.headers).length > 0) {
                        logText += `[Headers]: ${JSON.stringify(p.headers, null, 2)}\n`;
                    }
                    logText += `[Payload / Body]:\n${typeof p.body === 'object' ? JSON.stringify(p.body, null, 2) : p.body}\n\n`;
                });
            }
            logText += `==================================================`;

            const ta = document.getElementById('pastel-sniff-text');
            if (ta) ta.value = logText;
            overlay.style.display = 'flex';
        };

        const pushPacket = (type, data) => {
            if (!isRecording) return;
            recordedPackets.push({
                type,
                time: new Date().toLocaleTimeString(),
                url: data.url || 'N/A',
                method: data.method || '',
                headers: data.headers || {},
                body: data.body || ''
            });
        };

        // [후킹 1] Fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                if (isRecording) {
                    const [resource, config] = args;
                    const url = typeof resource === 'string' ? resource : resource?.url || '';
                    const method = (config?.method || (typeof resource === 'object' ? resource?.method : 'GET') || 'GET').toUpperCase();
                    let parsedBody = config?.body;
                    try { parsedBody = JSON.parse(config.body); } catch (_) {}
                    const h = {};
                    if (config?.headers instanceof Headers) {
                        config.headers.forEach((v, k) => { h[k] = v; });
                    } else if (typeof config?.headers === 'object') {
                        Object.assign(h, config.headers);
                    }
                    pushPacket('FETCH', { url, method, headers: h, body: parsedBody || config?.body });
                }
            } catch (_) {}
            return originalFetch.apply(this, args);
        };

        // [후킹 2] XHR
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._recMethod = method;
            this._recUrl = url;
            this._recHeaders = {};
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
            if (this._recHeaders) this._recHeaders[k] = v;
            return origSetHeader.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            try {
                if (isRecording) {
                    let parsedBody = body;
                    try { parsedBody = JSON.parse(body); } catch (_) {}
                    pushPacket('XHR', { url: this._recUrl, method: this._recMethod, headers: this._recHeaders, body: parsedBody || body });
                }
            } catch (_) {}
            return origSend.apply(this, arguments);
        };

        // [후킹 3] WebSocket
        const OrigWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new OrigWebSocket(url, protocols);
            try {
                const origWsSend = ws.send;
                ws.send = function(data) {
                    try {
                        if (isRecording) {
                            let parsed = data;
                            try { parsed = JSON.parse(data); } catch (_) {}
                            pushPacket('WEBSOCKET_SEND', { url: url, method: 'SEND', body: parsed || data });
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
