// wechat.js
(function () {
  function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  function handleWeChatBrowser() {
    if (!isWeChatBrowser()) return;

    var ua = navigator.userAgent.toLowerCase();
    var url = window.location.href;

    if (/android/.test(ua)) {
      // 安卓尝试直接调起 Chrome
      window.location.href =
        "intent://" + url.replace(/^https?:\/\//, "") +
        "#Intent;scheme=https;package=com.android.chrome;end";
    } else if (/iphone|ipad|ipod/.test(ua)) {
      // iOS 尝试调起 Safari
      window.location.href = "safari://" + url;
    } else {
      // 兜底方案：显示提示 & 外链按钮
      document.body.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;
                    background:#fff;display:flex;flex-direction:column;
                    justify-content:center;align-items:center;text-align:center;
                    font-size:18px;line-height:1.6;padding:20px;">
          <p>⚠️ 微信内置浏览器不支持，请点击下方按钮在系统浏览器中打开</p>
          <a href="${url}" target="_blank"
             style="margin-top:20px;padding:12px 20px;background:#007bff;
                    color:#fff;border-radius:8px;text-decoration:none;">
            在浏览器中打开
          </a>
        </div>`;
    }
  }

  // 页面加载完成时执行
  window.addEventListener("load", handleWeChatBrowser);
})();
