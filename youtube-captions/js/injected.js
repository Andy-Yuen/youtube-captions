function hasChinese() {
    document.querySelector('.ytp-settings-button').click();
    Array.from(document.querySelectorAll('.ytp-settings-menu .ytp-menuitem'))
        .find(e => e.innerText.includes('字幕') || e.innerText.includes('Subtitle'))
        .click();
    let includeChinese = Array.from(document.querySelectorAll('.ytp-settings-menu .ytp-menuitem'))
        .find(e => e.innerText.includes('中文') || e.innerText.includes('Chinese'));
    document.querySelector('.ytp-settings-button').click();
    return includeChinese;
}

var videoId;
xhook.before(request => {
    if (request.url.includes('/api/timedtext') &&
        !request.url.includes('&xhook') &&
        !request.url.includes('&tlang') &&
        document.querySelector('html').getAttribute('lang') === 'zh-CN'
    ) {
        var urlVideoId = request.url.split('?')[1].match(/(^|&)v=([^&]*)(&|$)/)[2];
        if (!urlVideoId.includes('en') && videoId !== urlVideoId) {
            videoId = urlVideoId;
            var language = '英语', subtitle = '字幕';
            if (!Array.from(document.querySelectorAll('.ytp-settings-menu .ytp-menuitem-content'))
                .find(e => e.innerText.includes(language))) {
                request.xhr.abort();
                document.querySelector('.ytp-settings-button').click();
                Array.from(document.querySelectorAll('.ytp-settings-menu .ytp-menuitem'))
                    .find(e => e.innerText.includes(subtitle)).click();
                Array.from(document.querySelectorAll('.ytp-settings-menu .ytp-menuitem'))
                    .find(e => e.innerText.includes(language)).click();
                document.querySelector('.ytp-settings-button').click();
            }
        }
    }
});

xhook.after((request, response) => {
    if (response.status === 200 && request.url.includes('/api/timedtext') &&
        !request.url.includes('xhook') && !request.url.includes('tlang')
    ) {
        var xhr = new XMLHttpRequest(), url;
        if (hasChinese()) {
            url = `https://www.youtube.com/api/timedtext?v=${request.url.split('?')[1]
                .match(/(^|&)v=([^&]*)(&|$)/)[2]}&lang=zh-CN&fmt=srv3&xhook`;
        } else {
            url = `${request.url}&tlang=zh-Hans`;
        }
        xhr.open('GET', url, false);
        xhr.send();

        if (response.xml.querySelector('head pen')) {
            xhr.responseXML.querySelectorAll('p').forEach(e => {
                var p = response.xml.querySelector(`p[t='${e.getAttribute('t')}']`);
                if (p) {
                    if (p.childElementCount && e.previousElementSibling) {
                        let previous = e.previousElementSibling;
                        previous.setAttribute('d', e.getAttribute('t') - previous.getAttribute('t'));
                    }
                    e.textContent = [p.textContent.replace('\n', ' '), e.textContent.replace('\n', ' ')].join('\n');
                }
            });
        } else {
            let firstCaption = response.xml.querySelector('body').innerHTML.replace(/\n/g, ' ');
            let secondCaption = xhr.responseXML.querySelector('body').innerHTML.replace(/\n/g, ' ');
            xhr.responseXML.querySelector('body').innerHTML = firstCaption + secondCaption;
        }

        response.text = new XMLSerializer().serializeToString(xhr.responseXML);
    }
});