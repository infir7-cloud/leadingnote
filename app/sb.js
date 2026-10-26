/* 리딩노트 ↔ Supabase 연결 (셸 index.html과 리딩 모음 ln.html이 함께 씀)
   - 프로젝트 정보는 가장 바깥 React 앱(App.tsx)이 window.__SB 로 넣어 줘요. 없으면 예전처럼 이 브라우저에만 저장해요.
   - 관리자 로그인 정보는 같은 사이트 안 모든 화면이 함께 써요 (localStorage 'ln.sb.session'). */
(function(){
  function findCfg(){var w=window;for(var i=0;i<5;i++){try{if(w.__SB&&w.__SB.projectId)return w.__SB}catch(e){}if(w===w.parent)break;try{w=w.parent}catch(e){break}}return null}
  var CFG=findCfg(),SKEY='ln.sb.session';
  var API=CFG?'https://'+CFG.projectId+'.supabase.co/functions/v1/make-server-f59ebbd9':'';
  var AUTH=CFG?'https://'+CFG.projectId+'.supabase.co/auth/v1':'';
  function getSess(){try{return JSON.parse(localStorage.getItem(SKEY))}catch(e){return null}}
  function setSess(s){try{if(s)localStorage.setItem(SKEY,JSON.stringify(s));else localStorage.removeItem(SKEY)}catch(e){}}
  function asJson(r){return r.text().then(function(t){var d={};try{d=t?JSON.parse(t):{}}catch(e){d={error:t}}if(!r.ok){var err=new Error(d.error||d.error_description||d.msg||('서버 오류 '+r.status));err.status=r.status;err.body=d;throw err}return d})}
  function call(path,opt){
    opt=opt||{};
    return (opt.auth?token():Promise.resolve(CFG.anonKey)).then(function(tk){
      return fetch(API+path,{method:opt.method||'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tk},body:opt.body?JSON.stringify(opt.body):undefined});
    }).then(asJson);
  }
  function authCall(q,body){return fetch(AUTH+q,{method:'POST',headers:{'Content-Type':'application/json',apikey:CFG.anonKey},body:JSON.stringify(body)}).then(asJson)}
  function keep(d,extra){var s=Object.assign({},getSess()||{},{access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()+(d.expires_in||3600)*1000},extra||{});setSess(s);return s}
  // 만료 1분 전이면 새 토큰으로 바꿔요
  function token(){
    var s=getSess();if(!s)return Promise.reject(Object.assign(new Error('관리자 로그인이 필요해요'),{status:401}));
    if(s.expires_at-Date.now()>60000)return Promise.resolve(s.access_token);
    return authCall('/token?grant_type=refresh_token',{refresh_token:s.refresh_token}).then(function(d){return keep(d).access_token},function(e){setSess(null);fire();throw Object.assign(new Error('로그인이 끝났어요. 다시 로그인해 주세요'),{status:401})});
  }
  var subs=[];function fire(){subs.forEach(function(f){try{f()}catch(e){}})}
  window.addEventListener('storage',function(e){if(e.key===SKEY)fire()});

  var LNSB={
    on:!!CFG,
    onAuth:function(f){subs.push(f)},
    session:getSess,
    isAdmin:function(){var s=getSess();return !!(s&&s.admin)},
    status:function(){return call('/admin/status')},
    setup:function(email,pw,name){return call('/admin/setup',{method:'POST',body:{email:email,password:pw,name:name}})},
    login:function(email,pw){
      return authCall('/token?grant_type=password',{email:email,password:pw}).then(function(d){
        keep(d,{email:email});
        return call('/admin/me',{auth:true}).then(function(me){keep(d,{email:me.email,name:me.name,admin:true});fire();return me},function(e){setSess(null);throw e});
      },function(e){throw new Error(/invalid/i.test(e.message)?'이메일 또는 비밀번호가 맞지 않아요':e.message)});
    },
    logout:function(){setSess(null);fire()},
    admins:function(){return call('/admin/admins',{auth:true})},
    addAdmin:function(email,pw,name){return call('/admin/admins',{method:'POST',auth:true,body:{email:email,password:pw,name:name}})},
    removeAdmin:function(id){return call('/admin/admins/'+encodeURIComponent(id),{method:'DELETE',auth:true})},
    log:function(){return call('/admin/log',{auth:true})},
    get:function(scope){return call('/content/'+scope)},
    put:function(scope,data,ver){return call('/content/'+scope,{method:'PUT',auth:true,body:{data:data,baseVer:ver}})},
    /* 공용 내용 묶기
       o.get(): 지금 공용 내용 · o.set(data): 서버 내용 반영 · o.onRemote(): 다시 그리기 · o.onState(st,msg): 저장 상태 알림 */
    bind:function(scope,o){
      var ver=0,last=null,loaded=false,timer=null,busy=false,again=false,state='load';
      function st(s,m){state=s;try{o.onState&&o.onState(s,m)}catch(e){}}
      function pull(){
        if(!CFG)return Promise.resolve();
        return LNSB.get(scope).then(function(r){
          ver=r.ver||0;
          if(r.data){o.set(r.data);last=JSON.stringify(o.get());o.onRemote&&o.onRemote()}
          else last=null;
          loaded=true;st('ok');
        },function(e){loaded=true;last=JSON.stringify(o.get());st('err','서버에 연결하지 못했어요. 잠시 뒤 다시 열어 주세요');console.log('[리딩노트] 서버 읽기 실패',e)});
      }
      function push(){
        if(busy){again=true;return}
        var cur=JSON.stringify(o.get());if(cur===last)return;
        busy=true;st('saving');
        LNSB.put(scope,JSON.parse(cur),ver).then(function(r){ver=r.ver;last=cur;busy=false;st('saved');if(again){again=false;push()}},function(e){
          busy=false;again=false;
          if(e.status===409&&e.body&&e.body.row){var row=e.body.row;ver=row.ver||0;if(row.data){o.set(row.data);last=JSON.stringify(o.get())}o.onRemote&&o.onRemote();st('conflict','다른 관리자가 먼저 바꿔서 최신 내용을 다시 불러왔어요. 방금 바꾼 것은 한 번 더 해 주세요')}
          else if(e.status===401||e.status===403){st('denied','관리자 로그인이 필요해요. 바꾼 내용이 서버에 저장되지 않았어요')}
          else st('err','서버에 저장하지 못했어요. 인터넷 연결을 확인해 주세요 ('+e.message+')');
          console.log('[리딩노트] 서버 저장 실패',e);
        });
      }
      var api={
        ready:pull(),
        state:function(){return state},
        // 저장할 때마다 불러요. 관리자로 로그인했을 때만 서버로 보내요
        touch:function(){if(!CFG||!loaded||!LNSB.isAdmin())return;clearTimeout(timer);timer=setTimeout(function(){timer=null;push()},500)},
        reload:function(){loaded=false;return pull()}
      };
      // 다른 관리자가 바꾼 내용도 화면으로 돌아올 때 다시 불러와요
      document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&loaded&&!busy&&!timer)pull()});
      return api;
    }
  };
  window.LNSB=LNSB;
})();
