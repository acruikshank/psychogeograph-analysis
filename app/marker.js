function Marker(view, start, end, name, color) {
  var out = {start: start, end: end, name: name, color: color}

  out.marker = genEl('div','marker',[
    genEl('input', {'class':'marker-name', tabindex:'-1', value:out.name}),
    genEl('button',{'class':'remove',tabindex:'-1'},'&#215;'),
    genEl('input',{'class':'color', type: 'color', tabindex: '-1', value: out.color})
  ])

  out.marker.querySelector('.marker-name').addEventListener('mousedown', function(e) { e.stopPropagation() })
  out.marker.querySelector('.remove').addEventListener('mousedown', function(e) { e.stopPropagation() })
  out.marker.querySelector('.color').addEventListener('mousedown', function(e) { e.stopPropagation() })
  out.marker.querySelector('.remove').addEventListener('click', function(e) { if (out.onremove) out.onremove() })

  out.marker.querySelector('.color').addEventListener('change', function(e) {
    out.color = e.target.value
    let style = out.marker.getAttribute('style')
    let bgProp = 'background-color: '+out.color+';'
    style = style ? style.replace(/background-color: (.*?);/, bgProp) : bgProp
    out.marker.setAttribute('style', style);
  })



  out.reposition = function(viewInterval) {
    let left = lerp(0, view.offsetWidth, viewInterval.fraction(start))
    let width = lerp(0, view.offsetWidth, viewInterval.fraction(end)) - left
    out.marker.setAttribute('style','background-color: '+out.color+';left: '+left+'px;width: '+width+'px;')
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

  function lerp(a,b,x) { return a + x*(b-a) }

  return out
}
