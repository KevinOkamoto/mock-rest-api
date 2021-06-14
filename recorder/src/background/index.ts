import WebRequestBodyDetails = chrome.webRequest.WebRequestBodyDetails;
import WebResponseHeadersDetails = chrome.webRequest.WebResponseHeadersDetails;

(function () {
    const networkFilters = {
        urls: [
            "*://*/*",
            '<all_urls>'
        ],
        types: ["xmlhttprequest"]
    };

    const SAVE_URL = 'http://localhost:3000/_save_';
    const RECORDING_HOST = 's1.ariba.com';
    const REDIRECT_HOST = 'http://localhost:3000';
    const extraInfoSpecOnCompleted = [
        "extraHeaders"
    ];
    const tabStorage: any = {};
    var gAttached = false;
    const uri2RequestId: any[] = [];
    const retryRequests: any[] = [];


    /**
     *  Redirecting to local MOCK API
     */
    chrome.webRequest.onBeforeRequest.addListener((details: WebRequestBodyDetails) => {
        if (!isRecording(details.url)
            && !details.url.includes('sockjs-node')
            && !details.url.includes(REDIRECT_HOST)) {
            const url = new URL(details.url);
            const newURL = details.url.replace(url.origin, REDIRECT_HOST);
            console.log('Redirecting from ' + url + ' to ' + newURL);

            return {redirectUrl: newURL};
        }


    }, networkFilters, ["blocking", "requestBody"]);

    // Setup for recording
    chrome.webRequest.onBeforeRequest.addListener(setupRecording, networkFilters,
        ["blocking", "requestBody"]);

    // Read request Headers
    chrome.webRequest.onSendHeaders.addListener((details) => {
        const {tabId, requestId, requestHeaders} = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: details.timeStamp,
            requestHeaders: requestHeaders,
            status: 'pending'
        });

    }, networkFilters, ['requestHeaders']);


    chrome.webRequest.onHeadersReceived.addListener((resp: WebResponseHeadersDetails) => {
        const responseHeaders = resp.responseHeaders;
        responseHeaders = responseHeaders.filter(elem => elem.name.toLowerCase() !== 'access-control-allow-origin' && elem.name.toLowerCase() !== 'access-control-allow-methods' )
        responseHeaders.push({'name': 'Access-Control-Allow-Origin','value': '*'});
        responseHeaders.push({'name': 'Access-Control-Allow-Methods', 'value': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'});


        return {responseHeaders};
    }, networkFilters, ['blocking', 'responseHeaders']);


    // Read request Headers
    chrome.webRequest.onResponseStarted.addListener((details) => {
        const {tabId, requestId, responseHeaders} = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: details.timeStamp,
            responseHeaders: responseHeaders,
            status: 'pending'
        });

    }, networkFilters, ["responseHeaders"]);


    chrome.webRequest.onCompleted.addListener((details) => {
        const {tabId, requestId} = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: details.timeStamp,
            requestDuration: details.timeStamp - request.startTime,
            status: 'complete'
        });
    }, networkFilters, ['extraHeaders']);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
            tabStorage[tabId] = {
                id: tabId,
                requests: {},
                registerTime: new Date().getTime()
            };
        }
    });

    chrome.tabs.onRemoved.addListener((tab) => {
        if (!tabStorage.hasOwnProperty(tab.tabId)) {
            return;
        }
        tabStorage[tab.tabId] = null;
        chrome.debugger.detach({tabId: tab.tabId});
    });

    chrome.debugger.onEvent.addListener(allEventHandler);


    function setupRecording(details: WebRequestBodyDetails) {
        const {tabId, requestId, requestBody, method} = details;
        if (!tabStorage.hasOwnProperty(tabId) || details.url === 'SAVE_URL' || !isRecording(details.url)) {
            return;
        }
        const urlID = requestIdByUri(details);
        const rBody = parseRequestBody(details);
        uri2RequestId.push({
            url: urlID,
            requestId: requestId
        });
        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            method: method,
            fullUrl: urlID,
            url: details.url,
            startTime: details.timeStamp,
            status: 'pending',
            reqBody: rBody
        };
        if (!gAttached) {
            gAttached = true;
            chrome.debugger.attach({tabId: tabId}, "1.0", () => {
                chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
            });
        }

    }


    function allEventHandler(source, method, params) {
        if (!tabStorage.hasOwnProperty(source.tabId) || params.type !== 'XHR') {
            return;
        }

        if (method == "Network.responseReceived" && params.response.url !== SAVE_URL) {

            // console.log('handleResponseBody: ', params);
            setTimeout(() => {
                handleResponseBody(source.tabId, params.requestId, params.response.url, params,
                    0);
            }, 800);
        }
    }

    /**
     * Getting this exception, but the problem is event Network.loadingFinished is not triggered
     * at all.
     *
     * Maybe it has something to do that I am using this from background task and not from devtool
     * tasks
     */
    function handleResponseBody(tabId, requestId, url, params, retries) {
        // console.log('handleResponseBody  - ' + url + ' - ' + retries);


        chrome.debugger.sendCommand({tabId: tabId}, "Network.getResponseBody",
            {"requestId": requestId}, (responseBody) => {
                // console.log('\t\t Network.getResponseBody: ', responseBody);

                if (!responseBody && shouldRetry(url, ++retries)) {
                    addRetryRequest(tabId, requestId, url, params, retries)
                }
                removeRetryRequest(url);

                var id2Url = uri2RequestId.filter((item) =>
                    item.url.includes(params.response.url));

                if (id2Url && id2Url.length > 0) {
                    const request = tabStorage[tabId].requests[id2Url[0].requestId];

                    if (!request) {
                        console.log('@@@@@ Problem with Untracked URL: ', url);

                    } else if (responseBody) {
                        /*responseBody.base64Encoded ? atob(responseBody.body) : */
                        const payload: any = responseBody.body;
                        Object.assign(request, {
                            responseData: JSON.parse(payload)
                        });
                        save(request);
                    }
                }
            });
    }

    function requestIdByUri(details: WebRequestBodyDetails) {
        const {tabId, requestId, requestBody} = details;
        if (requestBody && requestBody.raw) {
            const reqBodyData = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(requestBody.raw[0].bytes)));
            return details.url + '#' + reqBodyData;
        }
        return details.url;
    }

    function parseRequestBody(details: WebRequestBodyDetails) {
        const {tabId, requestId, requestBody} = details;
        if (requestBody && requestBody.raw) {
            const reqBodyData = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(requestBody.raw[0].bytes)));
            return JSON.parse(reqBodyData)
        }
        return null;
    }

    function shouldRetry(url, count) {
        return !retryRequests.includes(url) && count < 4
    }

    // Due to issue we need to do getResponseBody retry, but first add this to
    // retry queue to make sure we dont execute this if in progress
    function addRetryRequest(tabId, requestId, url, params, retries) {
        setTimeout(() => {
            retryRequests.push({u: url, count: retries});
            handleResponseBody(tabId, requestId, url, params, retries);
        }, 300);
    }

    function removeRetryRequest(url) {
        const index = retryRequests.findIndex((record) => record.url === url);
        if (index > -1) {
            retryRequests.splice(index, 1)
        }
    }

    function isRecording(url: string) {
        return url.includes(RECORDING_HOST)
    }

    function save(request: any) {
        var reqToSave = {
            key: request.fullUrl,
            method: request.method,
            body: request.responseData || null,
            headers: request.responseHeaders || null
        };

        console.log('Saving recording to MongoDB: ', reqToSave);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", SAVE_URL);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.onerror = function (err) {
            console.log("** An error occurred during the saving to DB", err);
        };

        xmlhttp.send(JSON.stringify(reqToSave));
    }
}());

