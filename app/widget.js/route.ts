import { env } from "@/lib/env";

export async function GET() {
  const script = `
(function(){
  var currentScript = document.currentScript;
  var orgId = currentScript && currentScript.getAttribute("data-org-id");
  if(!orgId || document.getElementById("harvello-widget-host")) return;
  var apiBase = "${env.NEXT_PUBLIC_APP_URL}";
  var host = document.createElement("div");
  host.id = "harvello-widget-host";
  document.body.appendChild(host);
  var root = host.attachShadow ? host.attachShadow({mode:"open"}) : host;
  var state = { open:false, messages:[] };
  function esc(value){ return String(value || "").replace(/[&<>"']/g,function(ch){ if(ch==="&") return "&amp;"; if(ch==="<") return "&lt;"; if(ch===">") return "&gt;"; if(ch==='"') return "&quot;"; return "&#39;"; }); }
  function css(accent,position){ var side = position === "left" ? "left:22px" : "right:22px"; return "<style>*{box-sizing:border-box}button,input{font:inherit}.btn{position:fixed;bottom:22px;"+side+";border:0;border-radius:999px;background:"+accent+";color:white;padding:14px 18px;box-shadow:0 14px 34px rgba(0,0,0,.22);cursor:pointer}.panel{position:fixed;"+side+";bottom:82px;width:min(380px,calc(100vw - 32px));height:540px;max-height:calc(100vh - 110px);background:white;border:1px solid #d8ddd4;border-radius:8px;box-shadow:0 18px 50px rgba(23,36,33,.2);display:flex;flex-direction:column;overflow:hidden;color:#172421}.head{padding:14px 16px;background:#f7f4ed;border-bottom:1px solid #d8ddd4;font-weight:700}.log{flex:1;padding:14px;overflow:auto;display:flex;flex-direction:column;gap:10px}.msg{padding:10px 12px;border-radius:8px;line-height:1.35}.u{align-self:flex-end;background:"+accent+";color:white}.a{align-self:flex-start;background:#f1f4ef}.form{display:flex;gap:8px;padding:12px;border-top:1px solid #d8ddd4}.form input{flex:1;border:1px solid #cbd4cb;border-radius:6px;padding:10px}.form button{border:0;background:"+accent+";color:white;border-radius:6px;padding:10px 12px}.prompts{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 12px}.prompt{border:1px solid #cbd4cb;background:white;border-radius:999px;padding:7px 9px;font-size:12px}</style>"; }
  function render(cfg){
    root.innerHTML = css(cfg.accentColor || "#2f6f5e", cfg.position || "right") + (state.open ? '<section class="panel"><div class="head">'+esc(cfg.assistantName||"Resident Assistant")+'</div><div class="log"><div class="msg a">'+esc(cfg.greeting||"How can I help?")+'</div>'+state.messages.map(function(m){return '<div class="msg '+(m.role==="user"?"u":"a")+'">'+esc(m.text)+'</div>'}).join("")+'</div><div class="prompts">'+(cfg.suggestedQuestions||[]).slice(0,3).map(function(q){return '<button class="prompt">'+esc(q)+'</button>'}).join("")+'</div><form class="form"><input maxlength="1000" placeholder="Ask a question"><button>Send</button></form></section>' : '') + '<button class="btn">'+(state.open?'Close':'Ask Harvello')+'</button>';
    root.querySelector(".btn").onclick = function(){ state.open = !state.open; render(cfg); };
    root.querySelectorAll(".prompt").forEach(function(button){ button.onclick = function(){ ask(button.textContent, cfg); }; });
    var form = root.querySelector(".form");
    if(form){ form.onsubmit = function(event){ event.preventDefault(); var input = form.querySelector("input"); ask(input.value, cfg); input.value = ""; }; }
  }
  function ask(text,cfg){
    if(!text) return;
    state.messages.push({role:"user",text:text});
    render(cfg);
    fetch(apiBase+"/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:orgId,question:text,mode:"widget"})}).then(readJson).then(function(data){
      state.messages.push({role:"assistant",text:data.answer || data.error || "I could not answer that."});
      render(cfg);
    }).catch(function(){
      state.messages.push({role:"assistant",text:"I could not reach the assistant right now. Please try again."});
      render(cfg);
    });
  }
  function readJson(response){ var type = response.headers && response.headers.get("content-type") || ""; if(type.indexOf("application/json") >= 0) return response.json(); return Promise.reject(new Error("Expected JSON")); }
  fetch(apiBase+"/api/widget/"+encodeURIComponent(orgId)).then(readJson).then(render).catch(function(){ render({}); });
})();`;

  return new Response(script, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}
