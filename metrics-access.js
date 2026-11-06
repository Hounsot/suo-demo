const SUPABASE_PUBLIC_KEY='sb_publishable_HCsnGmcJZnGGpaS7TYvldg_6PyiZJ1F';
const form=document.querySelector('#unlock-form'),password=document.querySelector('#password'),message=document.querySelector('#message'),submit=document.querySelector('#submit'),toggle=document.querySelector('#toggle');
const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
toggle.addEventListener('click',()=>{const reveal=password.type==='password';password.type=reveal?'text':'password';toggle.textContent=reveal?'Скрыть':'Показать';toggle.setAttribute('aria-label',reveal?'Скрыть пароль':'Показать пароль');});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(submit.disabled)return;submit.disabled=true;submit.textContent='Открываем…';message.textContent='';
 let vault;
 try{const response=await fetch('https://qrzoyciuaczbwdpvxpuw.supabase.co/functions/v1/suo-metrics',{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLIC_KEY,Authorization:'Bearer '+SUPABASE_PUBLIC_KEY},body:JSON.stringify({password:password.value}),cache:'no-store'});if(response.status===401){message.textContent='Неверный пароль. Попробуйте ещё раз.';password.select();submit.disabled=false;submit.textContent='Открыть метрики';return;}if(!response.ok)throw new Error('load');vault=await response.json();}
 catch{message.textContent='Не удалось загрузить материалы. Проверьте соединение и попробуйте ещё раз.';submit.disabled=false;submit.textContent='Открыть метрики';return;}
 try{
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password.value),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(vault.salt),iterations:vault.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(vault.iv),additionalData:new TextEncoder().encode('suo-metrics-v1:'+vault.sourceHash)},key,decode(vault.ciphertext));
  const payload=JSON.parse(new TextDecoder().decode(plaintext));password.value='';
  const frame=document.createElement('iframe');
  frame.title='Метрики и навигация';frame.setAttribute('sandbox','allow-scripts allow-downloads allow-modals allow-top-navigation-by-user-activation');
  frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;background:#101114';
  // srcdoc resolves relative anchors against its parent's URL. Keep section
  // links inside the decrypted document instead of reopening the login page.
  function localSections(){document.addEventListener('click',event=>{
   const link=event.target.closest('a[href^="#"]');if(!link)return;
   const section=document.getElementById(link.getAttribute('href').slice(1));
   if(section){event.preventDefault();section.scrollIntoView({block:'start'});}
  },true);}
  const router='<script>('+localSections.toString()+')();</script>';
  frame.srcdoc=payload.document.replace('</body>',router+'</body>');
  document.body.replaceChildren(frame);document.body.style.display='block';document.title='СУО — логика новой навигации';
 }catch{message.textContent='Неверный пароль. Попробуйте ещё раз.';password.select();submit.disabled=false;submit.textContent='Открыть метрики';}
});
