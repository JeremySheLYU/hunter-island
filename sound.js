/* Procedural surf, a small original pentatonic melody, and field sounds. */
(() => {
  let context, master, surf, breeze, timer, place = 'menu', beat = 0;
  let muted = false;
  try {muted = localStorage.getItem('island.sound') === 'off';} catch {}
  function note(hz, at, duration, volume, type='sine') {
    if (!context || muted || context.state !== 'running') return;
    const osc = context.createOscillator(), amp = context.createGain();
    osc.type = type; osc.frequency.value = hz;
    amp.gain.setValueAtTime(.00001, at);
    amp.gain.exponentialRampToValueAtTime(volume, at + Math.min(.03,duration*.1));
    amp.gain.exponentialRampToValueAtTime(.00001, at + duration);
    osc.connect(amp); amp.connect(master); osc.start(at); osc.stop(at + duration + .02);
  }
  function initialize() {
    if (muted) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio(); master = context.createGain(); master.gain.value = .32; master.connect(context.destination);
        const length = 4*context.sampleRate, buf = context.createBuffer(1,length,context.sampleRate);
        const out = buf.getChannelData(0); let last=0;
        for (let i=0;i<length;i++) {last=(last+.055*(Math.random()*2-1))/1.04;out[i]=last;}
        surf=context.createBufferSource(); surf.buffer=buf; surf.loop=true;
        const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;
        const amp=context.createGain();amp.gain.value=.18;
        breeze=context.createOscillator();breeze.type='sine';breeze.frequency.value=.12;
        const depth=context.createGain();depth.gain.value=.13;
        breeze.connect(depth);depth.connect(amp.gain);surf.connect(filter);filter.connect(amp);amp.connect(master);breeze.start();surf.start();
        timer=setInterval(()=>{
          if(document.hidden||muted||context.state!=='running')return;
          const melody = place==='menu'?[220,329.63,392,0,293.66,261.63,0,196]:[0,220,0,0,329.63,0,293.66,0,0,0,246.94,0];
          const hz=melody[beat++%melody.length];
          if(hz) {note(hz,context.currentTime,1.2,.045,'triangle');note(hz*2,context.currentTime+.05,.7,.014);}
        },1450);
      }
      if (context.state==='suspended') context.resume().catch(()=>{});
    } catch {}
  }
  function cue(kind='tap') {
    initialize(); if(!context||muted)return;
    const at=context.currentTime;
    const tones={tap:[440],action:[330,495],begin:[294,370,440,587],win:[392,494,587,784],lost:[330,294,220],map:[523,659]};
    (tones[kind]||tones.tap).forEach((hz,i)=>note(hz,at+.09*i,kind==='tap'?.08:.36,kind==='tap'?.045:.1,'triangle'));
  }
  function toggle(){muted=!muted;try {localStorage.setItem('island.sound',muted?'off':'on');}catch{}
    if(!muted)initialize();if(master&&context)master.gain.setTargetAtTime(muted?0:.32,context.currentTime,.04);return muted;}
  document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend().catch(()=>{});else if(!muted)context.resume().catch(()=>{});});
  window.IslandSound={cue,toggle,get muted(){return muted;},scene(value){place=value;},unlock:initialize};
})();
