import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const id='app.jkalucas.personalfitness';
const config=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
config.appId=id;config.appName='我的健身教练';config.webDir='dist-ios';
fs.writeFileSync(path.join(root,'capacitor.config.json'),JSON.stringify(config,null,2)+'\n');
function brand(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(['Pods','build','public','node_modules','.git'].includes(entry.name))continue;
  const target=path.join(dir,entry.name);
  if(entry.isDirectory()){brand(target);continue}
  if(!/\.(swift|m|h|plist|entitlements|pbxproj|rb)$/.test(entry.name))continue;
  const old=fs.readFileSync(target,'utf8');
  let text=old.replaceAll('ch.duartesantos.opengym',id).replaceAll('ch.opengym.app',id);
  if(entry.name==='Info.plist'&&dir===path.join(root,'ios','App','App')){
    text=text.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,'$1我的健身教练$2');
    // Repo media is packaged below; this personal build does not use App Store asset packs.
    text=text.replace(/\s*<key>BA(?:AppGroupID|HasManagedAssetPacks|UsesAppleHosting)<\/key>\s*(?:<string>[^<]*<\/string>|<true\/>)/g,'');
    if(!text.includes('UIFileSharingEnabled'))text=text.replace('</dict>\n</plist>','<key>UIFileSharingEnabled</key><true/>\n<key>LSSupportsOpeningDocumentsInPlace</key><true/>\n</dict>\n</plist>');
  }
  if(text!==old)fs.writeFileSync(target,text);
}}
brand(path.join(root,'ios'));
function run(args,env={}){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});if(r.status!==0)process.exit(r.status||1)}
run(['node_modules/vite/bin/vite.js','build','--outDir','dist-ios'],{VITE_MOBILE:'1',VITE_PERSONAL_APP:'1'});
run(['../scripts/catalogue/stage-media.mjs','dist-ios']);
run(['node_modules/@capacitor/cli/bin/capacitor','copy','ios']);
console.log('iOS web assets and Xcode source prepared. No signing or IPA has been produced.');
console.log('On a Mac: npx cap sync ios, then open ios/App/App.xcworkspace.');
