import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiHandler } from '../server/tour-api.mjs';
import { createAppServer } from '../server/index.mjs';
import { getApiUrl } from '../src/config/apiBase.mjs';
async function invoke(method, origin) {
  let text; const headers={};
  const res={setHeader(name,value){headers[name]=value},end(value){text=value}};
  await createApiHandler({})({url:'/api/status',method,headers: origin ? {origin} : {}},res);
  return {status:res.statusCode,headers,text};
}
test('production and QR app origins receive CORS headers',async()=>{
  for(const origin of ['https://aitmidtotrip.apps.tossmini.com','https://aitmidtotrip.private-apps.tossmini.com']) {
    const result=await invoke('GET',origin);
    assert.equal(result.status,200); assert.equal(result.headers['Access-Control-Allow-Origin'],origin);
    assert.equal(result.headers.Vary,'Origin'); assert.equal(JSON.parse(result.text).configured,false);
  }
});
test('foreign origins are blocked and not reflected',async()=>{
  const result=await invoke('GET','https://other-app.apps.tossmini.com');
  assert.equal(result.status,403);assert.equal(result.headers['Access-Control-Allow-Origin'],undefined);
});
test('preflight succeeds for QR origin',async()=>{
  const result=await invoke('OPTIONS','https://aitmidtotrip.private-apps.tossmini.com');
  assert.equal(result.status,204);assert.equal(result.headers['Access-Control-Allow-Methods'],'GET, OPTIONS');
});
test('HTTPS base address routes every API path while development keeps local path',()=>{
  for(const path of ['/api/status','/api/destinations?mood=rest','/api/destinations/123']) {
    assert.equal(getApiUrl('https://api.example.test/',path,true),'https://api.example.test'+path);
    assert.equal(getApiUrl('',path),path);
  }
});
test('release refuses empty, insecure or ambiguous addresses',()=>{
  for(const base of ['', 'http://api.example.test','https://user:secret@api.example.test','https://api.example.test/api','https://api.example.test?key=secret','https://api.example.test/#fragment']) assert.throws(()=>getApiUrl(base,'/api/status',true));
});
test('deployed server runs without .env or dist and responds to health and API',async()=>{
  const server=createAppServer({});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base='http://127.0.0.1:'+server.address().port;
    const health=await fetch(base+'/healthz'); assert.equal(health.status,200); assert.deepEqual(await health.json(),{ok:true});
    const status=await fetch(base+'/api/status',{headers:{Origin:'https://aitmidtotrip.private-apps.tossmini.com'}});
    assert.equal(status.status,200); assert.equal(status.headers.get('Access-Control-Allow-Origin'),'https://aitmidtotrip.private-apps.tossmini.com');
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
