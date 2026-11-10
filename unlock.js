(() => {
  const form=document.querySelector('#unlock-form');
  const input=document.querySelector('#password');
  const submit=document.querySelector('.submit');
  const error=document.querySelector('#error');
  document.querySelector('.reveal').addEventListener('click',event=>{
    const show=input.type==='password';input.type=show?'text':'password';
    event.currentTarget.textContent=show?'Masquer':'Afficher';
    event.currentTarget.setAttribute('aria-pressed',String(show));
  });
  const decode=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(submit.disabled)return;
    error.textContent='';submit.disabled=true;submit.textContent='Ouverture…';
    let stage='load';
    try {
      if(!globalThis.crypto?.subtle)throw Error('unsupported');
      const response=await fetch('content.enc.json?v=1',{cache:'no-store'});
      if(!response.ok)throw Error('load');
      const payload=await response.json();
      stage='decrypt';
      const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value.trim()),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(payload.salt),iterations:payload.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
      const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(payload.iv)},key,decode(payload.data));
      const bundle=JSON.parse(new TextDecoder().decode(plaintext));
      input.value='';
      stage='render';
      let html=bundle.html.replace(/<link\b[^>]*href="style\.css"[^>]*>/,'').replace(/<script\b[^>]*src="app\.js[^"\\]*"[^>]*><\/script>/,'');
      html=html.replace('</head>','<meta name="robots" content="noindex,nofollow,noarchive"></head>');
      document.open();document.write(html);document.close();
      const style=document.createElement('style');style.textContent=bundle.css;document.head.append(style);
      const script=document.createElement('script');script.textContent=bundle.js;document.body.append(script);
      const lock=document.createElement('button');lock.type='button';lock.textContent='Verrouiller';lock.style.cssText='border:1px solid #ded6c9;background:transparent;color:#80786e;font:11px Arial,sans-serif;padding:8px 10px;border-radius:3px;cursor:pointer';
      lock.addEventListener('click',()=>location.reload());document.querySelector('header').append(lock);
    } catch(exception) {
      if(stage==='render'){location.reload();return;}
      error.textContent=stage==='decrypt'?'Ce mot de passe ne correspond pas. Vérifie les lettres et les tirets, puis réessaie.':"Le cadeau n’a pas pu s’ouvrir. Vérifie ta connexion et utilise un navigateur récent à l’adresse HTTPS du site.";
      submit.disabled=false;submit.textContent='Ouvrir mon petit cadeau →';input.focus();
    }
  });
})();
