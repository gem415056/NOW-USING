// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.1.2
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
// @author       gemini
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

    // 1. 크랙 사이트 접속 시 최신 access_token 자동 포착 및 동기화
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

    // 2. crack.html 페이지 통신 중계 리스너 (HTTP + Socket.IO 하이브리드 브릿지)
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // [소켓 통신 전송 처리기]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const token = GM_getValue('crack_access_token', '');
            
            let wsUrl = 'wss://crack-api.wrtn.ai/character-chat/socket.io/?EIO=4&transport=websocket';
            if (token) {
                wsUrl += `&token=${encodeURIComponent(token)}`;
            }

            let ws = null;
            try {
                ws = new WebSocket(wsUrl);
            } catch (err) {
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '웹소켓 생성 실패: ' + err.message }, '*');
                return;
            }

            let pingIntervalTimer = null;
            let safetyTimeoutTimer = null;
            let accumulatedText = '';
            let isDoneSent = false;

            // 클로드 장문 응답을 위한 넉넉한 3분(180초) 안전 타이머
            safetyTimeoutTimer = setTimeout(() => {
                if (!isDoneSent && accumulatedText) {
                    isDoneSent = true;
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: accumulatedText }, '*');
                }
                if (ws) ws.close();
            }, 180000);

            ws.onopen = () => {
                console.log('[크랙 소켓] 연결 성공 (Open)');
            };

            ws.onmessage = (msgEvent) => {
                const raw = String(msgEvent.data || '');
                console.log('[크랙 소켓 수신]:', raw);

                // 1. Engine.IO 핸드셰이크 수신 -> 인증 정보와 함께 네임스페이스 접속 요청
                if (raw.startsWith('0')) {
                    try {
                        const hs = JSON.parse(raw.slice(1));
                        const interval = hs.pingInterval || 25000;
                        pingIntervalTimer = setInterval(() => {
                            if (ws && ws.readyState === WebSocket.OPEN) ws.send('3');
                        }, interval);
                    } catch (_) {}
                    
                    // 정규 인증 토큰 탑재 네임스페이스 접속
                    const authPayload = token ? JSON.stringify({ auth: { token: `Bearer ${token}` } }) : '';
                    ws.send(`40/v3/chats,${authPayload}`);
                    return;
                }

                // 2. 네임스페이스 접속 확인 -> 대화 메시지 send 이벤트 발송 (시퀀스 ID '1' 탑재)
                if (raw.startsWith('40/v3/chats')) {
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    console.log('[크랙 소켓 전송]:', sendPayload);
                    ws.send(sendPayload);
                    return;
                }

                // 3. 핑/퐁 유지
                if (raw === '2') {
                    ws.send('3');
                    return;
                }

                // 4. Socket.IO 이벤트 / Ack 콜백 패킷 해독
                if (raw.startsWith('42/v3/chats,') || raw.startsWith('43/v3/chats,')) {
                    try {
                        let jsonStr = raw.replace(/^4[23]\/v3\/chats,(\d+)?/, '');
                        const parsed = JSON.parse(jsonStr);

                        // A. 이벤트 배열 형태 (["chunk", ...], ["message", ...], ["publish", ...])
                        if (Array.isArray(parsed)) {
                            const evtName = parsed[0];
                            const evtData = parsed[1];

                            // 텍스트 추출 (다양한 필드 대응)
                            let piece = '';
                            if (typeof evtData === 'string') {
                                piece = evtData;
                            } else if (evtData && typeof evtData === 'object') {
                                piece = evtData.content || evtData.message || evtData.text || evtData.chunk || evtData.data?.content || evtData.data?.message || '';
                            }

                            if (piece) {
                                // 덮어쓰기형 전체 누적 텍스트인지 증분 조각인지 자동 판별
                                if (piece.length > accumulatedText.length && piece.startsWith(accumulatedText.slice(0, 10))) {
                                    accumulatedText = piece;
                                } else if (!accumulatedText.includes(piece)) {
                                    accumulatedText += piece;
                                }
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_CHUNK', reqId, text: accumulatedText }, '*');
                            }

                            // 종료 이벤트 감지
                            if (evtName === 'done' || evtName === 'end' || evtName === 'finish' || evtName === 'complete') {
                                if (!isDoneSent) {
                                    isDoneSent = true;
                                    const finalText = evtData?.content || evtData?.message || accumulatedText;
                                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: finalText }, '*');
                                }
                                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                                if (safetyTimeoutTimer) clearTimeout(safetyTimeoutTimer);
                                ws.close();
                            }

                            // 에러 이벤트 감지
                            if (evtName === 'error') {
                                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: evtData?.message || '소켓 에러가 발생했습니다.' }, '*');
                                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                                if (safetyTimeoutTimer) clearTimeout(safetyTimeoutTimer);
                                ws.close();
                            }
                        }
                    } catch (_) {}
                }
            };

            ws.onerror = (e) => {
                console.error('[크랙 소켓 에러]:', e);
                window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: '웹소켓 통신 에러가 발생했습니다.' }, '*');
            };

            ws.onclose = () => {
                console.log('[크랙 소켓 닫힘]');
                if (pingIntervalTimer) clearInterval(pingIntervalTimer);
                if (safetyTimeoutTimer) clearTimeout(safetyTimeoutTimer);
                if (!isDoneSent && accumulatedText) {
                    isDoneSent = true;
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: accumulatedText }, '*');
                }
            };

            return;
        }
```

**3. [붙여넣을 수정 코드 (핀포인트)]**
```javascript
        // [GM_xmlhttpRequest 기반 정규 Socket.IO Polling 전송 엔진]
        if (event.data.source === 'PASTEL_CRACK_SOCKET_SEND') {
            const { reqId, chatId, message } = event.data;
            const token = GM_getValue('crack_access_token', '');
            const baseUrl = 'https://crack-api.wrtn.ai/character-chat/socket.io/';

            const getHeaders = (isPost = false) => {
                const h = {
                    'Origin': 'https://crack.wrtn.ai',
                    'Referer': 'https://crack.wrtn.ai/',
                    'Accept': '*/*',
                    'platform': 'web',
                    'wrtn-locale': 'ko-KR'
                };
                if (token) {
                    h['Authorization'] = `Bearer ${token}`;
                }
                if (isPost) {
                    h['Content-Type'] = 'text/plain;charset=UTF-8';
                }
                return h;
            };

            const gmReq = (method, url, data = null) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: method,
                        url: url,
                        headers: getHeaders(method === 'POST'),
                        data: data,
                        withCredentials: true,
                        timeout: 30000,
                        onload: (res) => resolve(res.responseText || ''),
                        onerror: (err) => reject(new Error(err.error || 'Network Error')),
                        ontimeout: () => resolve('')
                    });
                });
            };

            (async () => {
                try {
                    let accumulatedText = '';
                    let isDone = false;

                    // 1단계: Engine.IO 핸드셰이크 요청 (SID 발급)
                    const handshakeRes = await gmReq('GET', `${baseUrl}?EIO=4&transport=polling&t=${Date.now()}`);
                    if (!handshakeRes.startsWith('0')) {
                        throw new Error('소켓 세션 초기화 실패: ' + handshakeRes);
                    }
                    const hsData = JSON.parse(handshakeRes.slice(1));
                    const sid = hsData.sid;
                    console.log('[크랙 Socket.IO] 세션 연결 성공 (SID):', sid);

                    // 2단계: 네임스페이스(/v3/chats) 접속 패킷 전송 (인증 토큰 포함)
                    const authPayload = token ? JSON.stringify({ auth: { token: `Bearer ${token}` } }) : '';
                    await gmReq('POST', `${baseUrl}?EIO=4&transport=polling&sid=${sid}&t=${Date.now()}`, `40/v3/chats,${authPayload}`);

                    // 3단계: 대화 메시지 send 이벤트 전송 (포착된 실제 패킷 규격 100% 일치)
                    const sendPayload = `42/v3/chats,1["send",{"chatId":"${chatId}","message":${JSON.stringify(message)}}]`;
                    console.log('[크랙 Socket.IO] 메시지 발송:', sendPayload);
                    await gmReq('POST', `${baseUrl}?EIO=4&transport=polling&sid=${sid}&t=${Date.now()}`, sendPayload);

                    // 4단계: 실시간 응답 패킷 수신 루프 (클로드 등 장문 모델 대비 최대 180초 폴링)
                    const startTime = Date.now();
                    while (!isDone && (Date.now() - startTime < 180000)) {
                        const pollRes = await gmReq('GET', `${baseUrl}?EIO=4&transport=polling&sid=${sid}&t=${Date.now()}`);
                        if (!pollRes) continue;

                        console.log('[크랙 Socket.IO 수신]:', pollRes);

                        // Engine.IO 패킷 분할 처리 (일반 텍스트 또는 0x1e 구분자 대응)
                        const packets = pollRes.split('\x1e');
                        for (const raw of packets) {
                            if (raw === '2') {
                                // Ping 수신 시 Pong 응답
                                await gmReq('POST', `${baseUrl}?EIO=4&transport=polling&sid=${sid}&t=${Date.now()}`, '3');
                                continue;
                            }

                            // 42/v3/chats 이벤트 패킷 파싱
                            if (raw.startsWith('42/v3/chats,') || raw.startsWith('43/v3/chats,')) {
                                try {
                                    const jsonStr = raw.replace(/^4[23]\/v3\/chats,(\d+)?/, '');
                                    const parsed = JSON.parse(jsonStr);

                                    if (Array.isArray(parsed)) {
                                        const [evtName, evtData] = parsed;

                                        // 토큰 스트리밍 추출
                                        let piece = '';
                                        if (typeof evtData === 'string') {
                                            piece = evtData;
                                        } else if (evtData && typeof evtData === 'object') {
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

                                        // 종료 이벤트 감지
                                        if (evtName === 'done' || evtName === 'end' || evtName === 'finish' || evtName === 'complete') {
                                            isDone = true;
                                            const finalText = evtData?.content || evtData?.message || accumulatedText;
                                            window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: finalText }, '*');
                                            break;
                                        }

                                        // 에러 이벤트 감지
                                        if (evtName === 'error') {
                                            isDone = true;
                                            window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: evtData?.message || '서버 오류' }, '*');
                                            break;
                                        }
                                    }
                                } catch (_) {}
                            }
                        }
                    }

                    if (!isDone && accumulatedText) {
                        window.postMessage({ source: 'PASTEL_CRACK_SOCKET_DONE', reqId, text: accumulatedText }, '*');
                    }

                } catch (err) {
                    console.error('[크랙 Socket.IO 에러]:', err);
                    window.postMessage({ source: 'PASTEL_CRACK_SOCKET_ERROR', reqId, error: err.message }, '*');
                }
            })();

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
