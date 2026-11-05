from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];r=root/'dist' if (root/'dist').exists() else root
files=['./']+['./'+p.relative_to(r).as_posix() for p in sorted(r.rglob('*')) if p.is_file() and p.name not in ['sw.js','offline-manifest.json','README.md'] and not any(x in p.relative_to(r).parts for x in ['scripts','tests','.git','.openai'])]
(r/'offline-manifest.json').write_text(json.dumps(files,indent=2))
source=(root/'scripts/sw-template.js').read_text()
version=hashlib.sha256(source.encode()+b''.join(p.read_bytes() for p in sorted(r.rglob('*')) if p.is_file() and p.name!='sw.js')).hexdigest()[:12]
(r/'sw.js').write_text(source.replace('__VERSION__',version))
print('Offline:',version,len(files)+1,'files')
