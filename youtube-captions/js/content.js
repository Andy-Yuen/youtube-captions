chrome.storage.sync.get('open', storage => {
    if (storage.open && ['www.youtube.com', 'www.youtube-nocookie.com'].includes(document.domain)) {
        var xHook = chrome.extension.getURL('js/xhook.min.js');
        if (!document.head.querySelector(`script[src='${xHook}']`)) {
            function injectJs(src) {
                let script = document.createElement('script');
                script.src = src;
                document.head.appendChild(script);
                return script;
            }

            injectJs(xHook).onload = function () {
                this.onload = null;
                injectJs(chrome.extension.getURL('js/injected.js'));
            };
        }
    }
});