function Signal(color, name, parent) {
  var out = {color: color, name: name};

  var canvas = genEl('canvas')
  var colorInput = genEl('input',{
    'class':'color',
    type: 'color',
    tabindex: '-1',
    value: color
  });
  colorInput.addEventListener('change', debounce(function(c) {
    out.color = colorInput.value;
    out.render();
  }, 2000))

  var signal = genEl('div','signal',[
    canvas,
    genEl('input', {'class':'signal-name', tabindex:'-1', value:out.name}),
    genEl('div','signal-controls', [
      genEl('button',{'class':'edit',tabindex:'-1'},'edit'),
      genEl('button',{'class':'remove',tabindex:'-1'},'remove'),
      colorInput
    ])
  ])

  signal.querySelector('.signal-name').addEventListener('mousedown', function(e) {
    e.stopPropagation()
  })
  signal.querySelector('.signal-name').addEventListener('change', function(e) {
    out.name = signal.querySelector('.signal-name').value
  })

  parent.appendChild(signal);

  var cw = canvas.width = canvas.offsetWidth * 2;
  var ch = canvas.height = canvas.offsetHeight * 2;
  var ctx = canvas.getContext('2d');
  var maxRange;
  var minRange;

  out.resize = function() {
    cw = canvas.width = canvas.offsetWidth * 2;
    ch = canvas.height = canvas.offsetHeight * 2;
  }

  out.addEventListener = function(type, f) {
    signal.addEventListener('click', function(e) {
      if (e.target.getAttribute('class') === type) {
        e.preventDefault()
        f(e);
        return false;
      }
    });
  }

  out.remove = function() {
    signal.remove();
  }

  out.generateScript = function generateScript(s) {
    var args = ['af3','af4','t7','t8','pz'].reduce(function(args,location) {
      return args.concat(['theta','alpha','low_beta','high_beta','gamma'].map(function(name) { return name+'_'+location }))
    }, []).concat('lat','lon')
    eval('function _generated_(time,'+args.join(',')+') {'+s+'}')
    out.f = _generated_;
    out.script = s;
  }

  out.render = function(data, startRange, endRange) {
    out.updateRanges(data, startRange, endRange);
    ctx.clearRect(0,0,cw,ch);
    var start = startRange / 1000;
    var end = endRange / 1000;

    ctx.fillStyle = out.color;
    ctx.globalAlpha = .5;

    var signalContext = new SignalContext();
    for (var i=0; i<cw; i++) {
      var time = lerp(start, end, i/cw);
      var sample = data.sampleAt(time);
      var result = out.f.apply(signalContext, sample);
      dot(ctx, i, project(minRange,maxRange,ch,0,result), color);
    }
  }

  out.exporter = function() {
    var signalContext = new SignalContext();
    return { sample: function(s) { return out.f.apply(signalContext, s) } }
  }

  out.updateRanges = function(data, startRange, endRange) {
    var start = startRange / 1000;
    var end = endRange / 1000;
    maxRange = null;
    minRange = null;

    var signalContext = new SignalContext();
    for (var i=0; i<cw; i++) {
      var time = lerp(start, end, i/cw);
      var sample = data.sampleAt(time);
      var result = out.f.apply(signalContext, sample);
      if (i) {
        maxRange = Math.max(maxRange, result);
        minRange = Math.min(minRange, result);
      } else {
        maxRange = result;
        minRante = result;
      }
    }
  }

  out.serialize = function() {
    return {color: out.color, name: out.name, script: out.script};
  }

  function dot(ctx, x, y, color) {
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI,true);
    ctx.fill();
  }

  function genEl(name, atts, content) {
    var e = document.createElement(name);

    if (typeof atts === 'object')
      for (var k in atts) e.setAttribute(k,atts[k])
    else if (typeof atts === 'string')
      e.setAttribute('class',atts);;

    if (typeof content === 'object')
      content.forEach(function(child) { e.appendChild(child) })
    else if (typeof content === 'string')
      e.innerHTML = content;
    return e;
  }

  return out;
}

function SignalContext() {};
SignalContext.prototype = {
  rollingAverage: function(value, samples) {
    if (!this.rolling)
      this.rolling = { samples: [], index: 0, average: 0 }
    var r = this.rolling;
    r.average = (value + r.samples.length*r.average - (r.samples[r.index]||0)) / Math.min(r.samples.length + 1, samples);
    r.samples[r.index] = value;
    r.index = (r.index+1) % samples;
    return r.average;
  },
  smooth: function(value, decay) {
    if (this.smoothValue === undefined)
      return this.smoothValue = value;
    return this.smoothValue = this.smoothValue*(1-decay) + value*decay;
  }
}

Signal.testScript = function(script, data) {
  var args = ['af3','af4','t7','t8','pz'].reduce(function(args,location) {
    return args.concat(['theta','alpha','low_beta','high_beta','gamma'].map(function(name) { return name+'_'+location }))
  }, [])
  eval('function _generated_(time,'+args.join(',')+') {'+script+'}')
  _generated_.apply(new SignalContext(), new Float64Array(26));
}

function debounce(f, delay) {
  var lastCalled, args, timeout;
  function execute() {
    f.apply(this, args);
    lastCalled = new Date().getTime();
    timeout = null;
  }
  return function() {
    args = arguments;
    if (timeout) return;
    if (!lastCalled) return execute();

    var remaining = delay - new Date().getTime() + lastCalled;
    if (remaining < 0) return execute();

    timeout = setTimeout(execute, remaining);
  }
}
