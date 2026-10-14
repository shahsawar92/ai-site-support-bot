/* Site Support Bot widget: <script src=".../widget.js" data-bot="BOT_ID" defer></script> */
(function () {
  var script = document.currentScript;
  var bot = script && script.getAttribute("data-bot");
  if (!bot || !/^[a-z0-9]{6,32}$/.test(bot)) return;
  var origin = new URL(script.src).origin;
  var open = false;
  var frame;

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open support chat");
  btn.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483646;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;" +
    "background:#17140f;color:#f97316;box-shadow:0 10px 30px rgba(0,0,0,.25);display:grid;place-items:center;transition:transform .15s";
  var chatIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var closeIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  btn.innerHTML = chatIcon;

  btn.onclick = function () {
    open = !open;
    if (open && !frame) {
      frame = document.createElement("iframe");
      frame.src = origin + "/embed/" + bot;
      frame.title = "Support chat";
      frame.style.cssText =
        "position:fixed;right:20px;bottom:88px;z-index:2147483647;width:min(380px,calc(100vw - 40px));height:min(560px,calc(100vh - 120px));" +
        "border:1px solid #e3ddd1;border-radius:16px;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,.25)";
      document.body.appendChild(frame);
    }
    if (frame) frame.style.display = open ? "block" : "none";
    btn.innerHTML = open ? closeIcon : chatIcon;
  };
  document.body.appendChild(btn);
})();
