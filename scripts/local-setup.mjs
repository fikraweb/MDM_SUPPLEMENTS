import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
if(!existsSync('.dev.vars.local')){
 writeFileSync('.dev.vars.local',`ADMIN_PASSWORD=${randomBytes(24).toString('base64url')}\nSESSION_SECRET=${randomBytes(48).toString('base64url')}\n`,{mode:0o600});
 console.log('Secrets locaux créés dans .dev.vars.local (ignoré par Git). Les valeurs ne sont pas affichées.');
}
for(const args of [['run','build'],['run','db:migrate']]){const result=spawnSync('npm',args,{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});if(result.status!==0)process.exit(result.status||1);}
console.log('Environnement local préparé. Démarrer avec npm run dev:worker.');
