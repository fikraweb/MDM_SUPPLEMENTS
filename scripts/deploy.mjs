import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
if(!config.d1_databases?.some(db=>db.binding==='DB'&&db.database_id&&!db.database_id.startsWith('00000000'))){console.error('Configurer d’abord le binding D1 DB dans wrangler.jsonc. Voir docs/dashboard-setup.md.');process.exit(1);}
for(const args of [['run','build'],['exec','--','wrangler','deploy']]){const result=spawnSync('npm',args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
