import sharp from 'sharp';
const out='docs/review/modernization';
for(const [name,reference,live] of [
 ['light','light','1440-no-preference-light-spread'],
 ['dark','dark','1440-no-preference-dark-spread'],
 ['cover','cover','1440-no-preference-light-cover'],
]) {
 const width=1200,height=760,header=64;
 const tiles=await Promise.all([`${out}/references/${reference}.png`,`${out}/${live}.png`].map(path=>sharp(path).resize(width,height,{fit:'contain',background:'#d8d6d0'}).png().toBuffer()));
 const labels=Buffer.from(`<svg width="2400" height="64"><rect width="2400" height="64" fill="#efe9de"/><g font-family="Georgia" font-size="24" fill="#2a2825"><text x="24" y="40">Approved concept · ${name}</text><text x="1224" y="40">Live implementation · original portrait and HTML text</text></g></svg>`);
 await sharp({create:{width:width*2,height:height+header,channels:3,background:'#d8d6d0'}}).composite([{input:labels,left:0,top:0},...tiles.map((input,i)=>({input,left:i*width,top:header}))]).png().toFile(`${out}/comparison-${name}.png`);
}
