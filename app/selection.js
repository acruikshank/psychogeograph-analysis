    function Selection(control, view) {
      var isDragging = false;
      var dragOrigin;
      var events = {}
      view.style.display = 'none';

      control.addEventListener('mousedown', e => {
        isDragging = true;
        view.style.display = 'none';
        view.style.left = dragOrigin = e.clientX;
        view.style.width =  0
      })

      control.addEventListener('mousemove', e => {
        if (isDragging) {
          view.style.display = 'block';
          if (e.clientX < dragOrigin) {
            view.style.left = e.clientX;
            view.style.width =  dragOrigin - e.clientX
          } else {
            view.style.left = dragOrigin;
            view.style.width =  e.clientX - parseInt(view.style.left)
          }
        }
      })

      function endDragging(e) {
        if (! isDragging) return;

        isDragging = false
        if (parseInt(view.style.width) < 1) {
          view.style.display = 'none';
          notify('click', e.clientX / control.offsetWidth)
          return;
        }

        let start = parseInt(view.style.left) / control.offsetWidth
        let width = parseInt(view.style.width) / control.offsetWidth
        notify('selection', {start: start, width: width})
      }

      control.addEventListener('mouseup', endDragging)
      control.addEventListener('mouseleave', endDragging)
      control.addEventListener('mouseenter', endDragging)

      function addEventListener(type, fn) { (events[type] = events[type] || []).push(fn) }
      function notify(type, data) { if (events[type]) events[type].forEach((f) => f(data)) }

      return { addEventListener: addEventListener }
    }
