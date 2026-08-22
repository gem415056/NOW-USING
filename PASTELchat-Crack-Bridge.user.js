// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      2.0.5
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

        // 파스텔챗에서 전달된 자동 발송 매크로 실행 (3중 복귀 트리거 탑재)
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData && dispatchData.message) {
            const returnTargetUrl = dispatchData.returnUrl || GM_getValue('pastel_saved_return_url', '');
            const startTime = Date.now();
            let isExecuted = false;
            let returnTriggered = false;

            // 파스텔챗으로 되돌아가는 확실한 함수
            const goBackToPastel = () => {
                if (returnTriggered) return;
                returnTriggered = true;
                GM_setValue('pastel_macro_dispatch', null);

                setTimeout(() => {
                    if (returnTargetUrl) {
                        window.location.href = returnTargetUrl;
                    } else if (document.referrer && document.referrer.includes('crack.html')) {
                        window.location.href = document.referrer;
                    } else {
                        window.history.back();
                    }
                }, 1200);
            };

            // 사용자가 손으로 전송 버튼을 직접 눌렀을 때도 즉시 복귀 감지
            document.addEventListener('click', (ev) => {
                const btn = ev.target.closest('button');
                if (btn && (btn.querySelector('path[d*="M18.77"]') || btn.innerHTML.includes('M18.77') || btn.style.backgroundColor.includes('196'))) {
                    goBackToPastel();
                }
            }, true);

            const macroTimer = setInterval(() => {
                const editor = document.querySelector('.ProseMirror') ||
                               document.querySelector('[contenteditable="true"]') ||
                               document.querySelector('div[role="textbox"]') ||
                               document.querySelector('textarea');

                if (editor && !isExecuted) {
                    isExecuted = true;
                    clearInterval(macroTimer);

                    // 1) 에디터 포커스 및 텍스트 주입
                    editor.focus();
                    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, dispatchData.message);
                    } else {
                        editor.innerHTML = `<p>${dispatchData.message.replace(/\n/g, '<br>')}</p>`;
                    }

                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));

                    // 엔터 키 입력 시 복귀 연동
                    editor.addEventListener('keydown', (ke) => {
                        if (ke.key === 'Enter' && !ke.shiftKey) {
                            goBackToPastel();
                        }
                    });

                    // 2) 0.6초 후 전송 버튼 자동 클릭 시도
                    setTimeout(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const targetSendBtn = buttons.find(b => b.querySelector('path[d*="M18.77"]') || b.innerHTML.includes('M18.77')) ||
                                              buttons.find(b => b.style.backgroundColor.includes('196') || b.style.backgroundColor.includes('rgb(10, 196, 0)')) ||
                                              document.querySelector('form button[type="submit"]');

                        if (targetSendBtn) {
                            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evtName => {
                                targetSendBtn.dispatchEvent(new MouseEvent(evtName, { bubbles: true, cancelable: true, view: window }));
                            });
                            if (typeof targetSendBtn.click === 'function') targetSendBtn.click();
                        }

                        // 엔터 키 병행 격발
                        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));

                        // 3) 입력창이 비워지거나 전송 완료 시 자동 복귀 감시 루프
                        const watchCleared = setInterval(() => {
                            const txt = (editor.textContent || '').trim();
                            if (txt === '' || editor.querySelector('.is-editor-empty') || !txt.includes(dispatchData.message.slice(0, 6))) {
                                clearInterval(watchCleared);
                                goBackToPastel();
                            }
                        }, 300);
                    }, 600);
                }

                // 40초 타임아웃 시 안전 복귀
                if (Date.now() - startTime > 40000) {
                    clearInterval(macroTimer);
                    goBackToPastel();
                }
            }, 400);
        }
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 리스너: 순정 대화목록/캐시 조회 + 매크로 신호 수신]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // B방식 매크로 발송 데이터 저장
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

        // 100% 순정 HTTP 요청 처리기 (대화목록/과거기록/캐시 조회 완벽 작동)
        if (event.data.source === 'PASTEL_CRACK_REQUEST') {
            const { reqId, method, url, headers, data, responseType } = event.data;
            const cachedToken = GM_getValue('crack_access_token', '');

            const reqHeaders = Object.assign({
                'Origin': 'https://crack.wrtn.ai',
                'Referer': 'https://crack.wrtn.ai/',
                'platform': 'web',
                'wrtn-locale': 'ko-KR',
                'x-wrtn-id': 'W2.2.7ee13701.b310.4f07.a89b.36d023805b50'
            }, headers || {});

            if (cachedToken && !reqHeaders['authorization'] && !reqHeaders['Authorization']) {
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

    // 브릿지 활성화 신호 주입
    window.PASTEL_CRACK_BRIDGE_READY = true;
    document.addEventListener('DOMContentLoaded', () => {
        window.postMessage({ source: 'PASTEL_CRACK_BRIDGE_READY' }, '*');
    });
})();
