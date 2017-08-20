function Interval(start, end) {
  var out = {
    start: start,
    end: end,
    syncPoint: start
  }

  out.union = function(other) {
    let diff = other.syncPoint - this.syncPoint
    return Interval(
      Math.min(this.start, other.start - diff),
      Math.max(this.end, other.end - diff)
    )
  }

  out.intersection = function(other) {
    let diff = other.syncPoint - this.syncPoint
    let start = Math.max(this.start, other.start - diff)
    return Interval(
      start,
      Math.max(start, Math.min(this.end, other.end - diff))
    )
  }

  out.interp = function(fraction) {
    return this.start + fraction*(this.end - this.start)
  }

  out.fraction = function(time) {
    return (time-this.start) / (this.end - this.start)
  }

  return out;
}
