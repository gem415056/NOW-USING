// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      2.1.0.1
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
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

    // =========================================================================
    // [1. crack.wrtn.ai 공식 사이트: 토큰 자동 캐싱 & B방식 자동 입력 매크로]
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

        // 파스텔챗에서 전달된 텍스트 자동 입력 & 안전장치 팝업
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData) {
            const returnUrl = dispatchData.returnUrl || '';

            // 1. [돌아가기 알약 플로팅 버튼]
            const injectReturnPillButton = () => {
                if (document.getElementById('pastel-return-floating-pill')) return;
                const pill = document.createElement('div');
                pill.id = 'pastel-return-floating-pill';
                pill.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);z-index:2147483647;cursor:pointer;user-select:none;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);background-color:#3a001e !important;border:1.5px solid #FF4432 !important;border-radius:9999px !important;padding:9px 16px !important;transition:transform 0.15s ease, opacity 0.15s ease;pointer-events:auto;';
                pill.innerHTML = `<p style="color:#fff5f1 !important;font-size:12px !important;font-weight:bold !important;margin:0 !important;white-space:nowrap !important;line-height:1 !important;">돌아가기</p>`;

                pill.onclick = () => {
                    GM_setValue('pastel_macro_dispatch', null);
                    if (returnUrl) window.location.href = returnUrl;
                    else window.history.back();
                };
                (document.body || document.documentElement).appendChild(pill);
            };

            injectReturnPillButton();

            // 2. [타임아웃 시 뜰 원클릭 복사 모달 팝업]
            const showFallbackCopyModal = (rawText) => {
                if (document.getElementById('pastel-fallback-copy-modal')) return;
                const modal = document.createElement('div');
                modal.id = 'pastel-fallback-copy-modal';
                modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

                modal.innerHTML = `
                    <div style="background:#ffffff;border-radius:16px;padding:20px;max-width:500px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;flex-direction:column;gap:12px;box-sizing:border-box;color:#222;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <strong style="font-size:15px;color:#FF4432;">⚠️ 자동 입력 지연 (수동 복사 안내)</strong>
                            <button id="pastel-modal-close-btn" style="background:none;border:none;font-size:16px;cursor:pointer;color:#888;">✕</button>
                        </div>
                        <p style="font-size:12px;color:#666;margin:0;line-height:1.4;">크랙 사이트 로딩이 길어져 자동 입력이 지연되었습니다. 아래 버튼을 눌러 복사 후 입력창에 붙여넣어 주세요.</p>
                        <textarea id="pastel-fallback-textarea" readonly style="width:100%;height:140px;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px;resize:none;box-sizing:border-box;background:#f9f9f9;color:#222;outline:none;">${rawText}</textarea>
                        <button id="pastel-modal-copy-btn" style="background:#FF4432;color:#ffffff;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:bold;cursor:pointer;width:100%;">📋 전체 복사하기</button>
                    </div>
                `;
                document.body.appendChild(modal);

                document.getElementById('pastel-modal-close-btn').onclick = () => modal.remove();
                document.getElementById('pastel-modal-copy-btn').onclick = () => {
                    const ta = document.getElementById('pastel-fallback-textarea');
                    ta.select();
                    navigator.clipboard.writeText(rawText);
                    const btn = document.getElementById('pastel-modal-copy-btn');
                    btn.textContent = '✨ 복사 완료! (입력창에 붙여넣기 하세요)';
                    btn.style.backgroundColor = '#2ecc71';
                    setTimeout(() => modal.remove(), 1200);
                };
            };

            // 3. [30초 조기 복사 팝업 + 3분 백그라운드 끈질긴 자동 입력 루프]
            if (dispatchData.message) {
                const startTime = Date.now();
                const POPUP_LIMIT = 30000;    // 30초 후 복사 팝업 노출
                const TIMEOUT_LIMIT = 180000; // 3분(180초) 최종 감시 한도
                let popupShown = false;

                const inputTimer = setInterval(() => {
                    const editor = document.querySelector('.ProseMirror') ||
                                   document.querySelector('[contenteditable="true"]') ||
                                   document.querySelector('div[role="textbox"]') ||
                                   document.querySelector('textarea');

                    if (editor) {
                        clearInterval(inputTimer);
                        editor.focus();

                        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                            document.execCommand('selectAll', false, null);
                            document.execCommand('insertText', false, dispatchData.message);
                        } else {
                            editor.innerHTML = `<p>${dispatchData.message.replace(/\n/g, '<br>')}</p>`;
                        }

                        editor.dispatchEvent(new Event('input', { bubbles: true }));
                        editor.dispatchEvent(new Event('change', { bubbles: true }));

                        // 만약 30초 경과로 복사 팝업이 떠 있었다면, 자동 입력 성공 시 팝업을 알아서 닫아줌
                        const fallbackModal = document.getElementById('pastel-fallback-copy-modal');
                        if (fallbackModal) fallbackModal.remove();
                        return;
                    }

                    // 30초가 지나도 입력창을 못 찾으면 유저가 바로 복사할 수 있게 팝업 노출 (루프는 계속 유지)
                    if (!popupShown && (Date.now() - startTime > POPUP_LIMIT)) {
                        popupShown = true;
                        showFallbackCopyModal(dispatchData.message);
                    }

                    // 3분 초과 시 탐색 루프 최종 종료
                    if (Date.now() - startTime > TIMEOUT_LIMIT) {
                        clearInterval(inputTimer);
                    }
                }, 400);
            }
        }
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 리스너: 순정 대화목록/캐시 조회 + 매크로 신호 수신]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        if (event.data.source === 'PASTEL_CRACK_MACRO_DISPATCH') {
            GM_setValue('pastel_macro_dispatch', {
                message: event.data.message,
                chatId: event.data.chatId,
                storyId: event.data.storyId,
                returnUrl: event.data.returnUrl,
                t: Date.now()
            });
            return;
        }

        if (event.data.source === 'PASTEL_CRACK_REQUEST') {
            const { reqId, method, url, headers, data, responseType } = event.data;
            const cachedToken = GM_getValue('crack_access_token', '');
            const cachedWId = GM_getValue('crack_w_id', 'W2.2.ba1dca25.315c.4cf1.acd3.28b9c450e340');

            const reqHeaders = Object.assign({
                'Origin': 'https://crack.wrtn.ai',
                'Referer': 'https://crack.wrtn.ai/',
                'platform': 'web',
                'wrtn-locale': 'ko-KR',
                'x-wrtn-id': cachedWId,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
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
                timeout: event.data.timeout || 120000,
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
                onerror: function(err) {
                    window.postMessage({
                        source: 'PASTEL_CRACK_RESPONSE',
                        reqId: reqId,
                        status: 0,
                        error: err.error || 'Network/Bridge Error'
                    }, '*');
                }
            });
        }
    });

    window.PASTEL_CRACK_BRIDGE_READY = true;
    document.addEventListener('DOMContentLoaded', () => {
        window.postMessage({ source: 'PASTEL_CRACK_BRIDGE_READY' }, '*');
    });
})();
