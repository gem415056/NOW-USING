// ==UserScript==
// @name         PASTELchat Crack API Bridge & Packet Recorder
// @namespace    https://github.com/
// @version      3.0.0
// @description  Bypass CORS, bridge PASTELchat crack.html with crack.wrtn.ai and record WebSocket packets
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
// @grant        unsafeWindow
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // [0. 웹소켓 & Fetch 통신 가로채기 엔진 (메인 월드 주입)]
    // =========================================================================
    const injectionCode = `
    (function() {
        window.__PASTEL_RECORDING__ = false;
        window.__PASTEL_PACKET_LOGS__ = [];

        function logPacket(type, direction, urlOrEvent, data) {
            if (!window.__PASTEL_RECORDING__) return;
            const time = new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
            window.__PASTEL_PACKET_LOGS__.push({
                time: time,
                type: type,
                dir: direction,
                target: urlOrEvent,
                data: data
            });
            console.log('%c[PASTEL-REC] ' + direction + ' [' + type + ']', 'color: #FF4432; font-weight: bold;', data);
        }

        // 1. WebSocket Hook
        const OrigWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new OrigWebSocket(url, protocols);
            
            const origSend = ws.send;
            ws.send = function(data) {
                logPacket('WS', 'SEND (송신 ➔)', url, data);
                return origSend.apply(this, arguments);
            };

            ws.addEventListener('message', function(e) {
                logPacket('WS', 'RECV (수신 ⬅)', url, e.data);
            });

            return ws;
        };
        window.WebSocket.prototype = OrigWebSocket.prototype;

        // 2. Fetch Hook (Socket.IO 폴링 및 REST API 감청)
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            const method = (args[1]?.method || 'GET').toUpperCase();
            const reqBody = args[1]?.body;

            if (url.includes('crack-api') || url.includes('socket.io') || url.includes('crack-gen')) {
                logPacket('FETCH', 'REQ (송신 ➔) [' + method + ']', url, reqBody);
            }

            const response = await origFetch.apply(this, args);
            
            if (url.includes('crack-api') || url.includes('socket.io') || url.includes('crack-gen')) {
                const clone = response.clone();
                clone.text().then(resText => {
                    logPacket('FETCH', 'RES (수신 ⬅) [' + response.status + ']', url, resText);
                }).catch(() => {});
            }
            return response;
        };

        // 3. Recorder Control Events
        window.addEventListener('message', function(e) {
            if (e.data?.action === 'PASTEL_START_REC') {
                window.__PASTEL_PACKET_LOGS__ = [];
                window.__PASTEL_RECORDING__ = true;
                console.log('%c[PASTEL] 🔴 통신 패킷 녹화가 시작되었습니다.', 'color:#2ecc71; font-size:14px; font-weight:bold;');
            } else if (e.data?.action === 'PASTEL_STOP_REC') {
                window.__PASTEL_RECORDING__ = false;
                window.postMessage({
                    action: 'PASTEL_REC_RESULT',
                    logs: window.__PASTEL_PACKET_LOGS__
                }, '*');
                console.log('%c[PASTEL] ⏹ 통신 패킷 녹화가 종료되었습니다.', 'color:#FF4432; font-size:14px; font-weight:bold;');
            }
        });
    })();
    `;

    const scriptEl = document.createElement('script');
    scriptEl.textContent = injectionCode;
    (document.head || document.documentElement).appendChild(scriptEl);
    scriptEl.remove();

    // =========================================================================
    // [1. crack.wrtn.ai 사이트 UI: 녹화 제어기 플로팅 버튼 & 자동 매크로]
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

        // 녹화 제어 플로팅 UI 생성
        const injectRecorderUI = () => {
            if (document.getElementById('pastel-recorder-btn')) return;
            const btn = document.createElement('button');
            btn.id = 'pastel-recorder-btn';
            btn.style.cssText = 'position:fixed;top:15px;right:20px;z-index:2147483647;padding:10px 16px;border-radius:24px;border:2px solid #FF4432;background:#1a1918;color:#fff;font-weight:bold;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.5);display:flex;align-items:center;gap:6px;';
            btn.innerHTML = `🔴 <span>통신 패킷 녹화 시작</span>`;

            let isRecording = false;

            btn.onclick = () => {
                if (!isRecording) {
                    isRecording = true;
                    btn.style.background = '#FF4432';
                    btn.innerHTML = `⏹ <span>녹화 중지 & 로그 복사</span>`;
                    window.postMessage({ action: 'PASTEL_START_REC' }, '*');
                } else {
                    isRecording = false;
                    btn.style.background = '#1a1918';
                    btn.innerHTML = `⏳ <span>추출 중...</span>`;
                    window.postMessage({ action: 'PASTEL_STOP_REC' }, '*');
                }
            };
            (document.body || document.documentElement).appendChild(btn);
        };

        window.addEventListener('message', (e) => {
            if (e.data?.action === 'PASTEL_REC_RESULT') {
                const logs = e.data.logs || [];
                const formatted = JSON.stringify(logs, null, 2);
                
                navigator.clipboard.writeText(formatted).then(() => {
                    const btn = document.getElementById('pastel-recorder-btn');
                    if (btn) btn.innerHTML = `✨ <span>복사 완료! (AI에게 붙여넣기)</span>`;
                    setTimeout(injectRecorderUI, 3000);
                });

                // 화면에 즉시 확인할 수 있는 팝업창도 띄워줌
                showLogViewerModal(formatted);
            }
        });

        const showLogViewerModal = (logText) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;color:#fff;font-family:monospace;';
            modal.innerHTML = `
                <div style="background:#222;border-radius:12px;padding:20px;max-width:800px;width:100%;height:80vh;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;border:1px solid #444;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong style="color:#FF4432;font-size:16px;">📋 녹화된 통신 패킷 데이터 (클립보드 자동 복사됨)</strong>
                        <button id="pastel-close-log-modal" style="background:#444;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">닫기</button>
                    </div>
                    <textarea readonly style="flex:1;background:#141413;color:#00ff66;border:1px solid #333;border-radius:8px;padding:12px;font-size:12px;resize:none;outline:none;">${logText}</textarea>
                    <button id="pastel-re-copy-btn" style="background:#FF4432;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:bold;cursor:pointer;">다시 클립보드에 복사하기</button>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#pastel-close-log-modal').onclick = () => modal.remove();
            modal.querySelector('#pastel-re-copy-btn').onclick = () => {
                navigator.clipboard.writeText(logText);
                alert("클립보드에 다시 복사되었습니다!");
            };
        };

        window.addEventListener('DOMContentLoaded', injectRecorderUI);
        setTimeout(injectRecorderUI, 1500);

        // 파스텔챗에서 전달된 텍스트 자동 입력 매크로 유지
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData && dispatchData.message) {
            GM_setValue('pastel_macro_dispatch', null);
            const inputTimer = setInterval(() => {
                const editor = document.querySelector('.ProseMirror') ||
                               document.querySelector('[contenteditable="true"]') ||
                               document.querySelector('div[role="textbox"]') ||
                               document.querySelector('textarea');
                if (editor) {
                    clearInterval(inputTimer);
                    editor.focus();
                    document.execCommand('selectAll', false, null);
                    document.execCommand('insertText', false, dispatchData.message);
                    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: dispatchData.message }));
                }
            }, 300);
        }
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 리스너: GET 목록/캐시 조회]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

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
