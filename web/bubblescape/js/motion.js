var Motion = {
  
  initialized: false,
  walkers: [],
  moving: true,
  path: "M23.375,11.688c0,6.455-5.233,11.688-11.688,11.688S0,18.142,0,11.688S5.233,0,11.688,0S23.375,5.233,23.375,11.688z",
  
  initialize: function() {
    var self = this;
    
    if (self.initialized) return true;
    
    $(window).blur(function() {
      Motion.stop();
    });
    
    $(window).focus(function() {
      Motion.resume();
    });
    
    self.initialized = true;
  },

  start: function(bubble) {
    var self = this;
    var thisWalker = new PathWalker(bubble[0]);
  	thisWalker.start();
  	self.walkers.push(thisWalker);
  },
  
  stop: function() {
    var self = this;
    if (!self.moving) return false;
    //console.log('stopping motion');
    $.each(self.walkers, function(index, thisWalker) {
      thisWalker.pathAnimator.stop();
    });
    self.moving = false;
  },
  
  resume: function() {
    var self = this;
    //console.log('resuming motion');
    $.each(self.walkers, function(index, thisWalker) {
      thisWalker.resume();
    });
    self.moving = true;
  }
};


// handles whatever moves along the path
function PathWalker(walkerObj) {
  var self = this;
  self.pathAnimator = new PathAnimator(Motion.path);
  self.walker = $(walkerObj)[0];
  self.reverse = Math.random()<.5; // random boolean
  self.speed = 10;
  self.easing = '';
  self.startOffset = Math.floor(Math.random()*100);
  self.startX = 0;
  self.startY = 0;
  //self.startX = parseInt($(self.walker).data('startX'));
  //self.startY = parseInt($(self.walker).data('startY'));
  self.bg = $(self.walker).css('background-image');
}

PathWalker.prototype = {
  start : function() {
    var self = this;
    self.pathAnimator.context = this;
    self.pathAnimator.start(
      self.speed, self.step, self.reverse, self.startOffset, self.finish, self.easing);
  },

  // Execute every "frame"
  step : function(point) {
    var self = this;
    var newX = point.x + self.startX;
    var newY = point.y + self.startY;
    $(self.walker).css({left: newX, top: newY});
    //Connections.redraw();
  },

  // Restart animation once it was finished
  finish : function() {
    var self = this;
    self.startOffset = (self.reverse || self.speed < 0) ? 100 : 0;
    self.start();
  },

  // Resume animation from the last completed percentage
  resume : function() {
    var self = this;
    self.pathAnimator.start(
      self.speed, self.step, self.reverse, self.pathAnimator.percent, self.finish, self.easing);
  }
};


/*-----------------------------
	Path Animator v1.1.0
	(c) 2013 Yair Even Or <http://dropthebit.com>
	
	MIT-style license.
------------------------------*/
function PathAnimator(path){
  if( path ) this.updatePath(path);
  this.timer = null;
}

PathAnimator.prototype = {
  
  start : function( duration, step, reverse, startPercent, callback, easing ){
    this.stop();
    this.percent = startPercent || 0;

    if( duration == 0 ) return false;

    var that = this,
    startTime = new Date(),
    delay = 1000/60;

    (function calc(){
      var p = [], angle, 
      now = new Date(),
      elapsed = (now-startTime)/1000,
      t = (elapsed/duration), 
      percent = t * 100;

      // easing functions: https://gist.github.com/gre/1650294
      if (typeof easing == 'function')
        percent = easing(t) * 100;

      if (reverse)
        percent = startPercent - percent;
      else
        percent += startPercent;

      that.running = true;

      // On animation end (from '0%' to '100%' or '100%' to '0%')
      if( percent > 100 || percent < 0 ) {
        that.stop();
        return callback.call( that.context );
      }

      that.percent = percent;	// save the current completed percentage value

      //  angle calculations
      p[0] = that.pointAt( percent - 1 );
      p[1] = that.pointAt( percent + 1 );
      //angle = Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)*180 / Math.PI;

      // do one step ("frame") 
      step.call( that.context, that.pointAt(percent) );
      // advance to the next point on the path 
      that.timer = setTimeout( calc, delay );
    })();
  },

  stop : function(){
    clearTimeout( this.timer );
    this.timer = null;
    this.running = false;
  },

  pointAt : function(percent){
    return this.path.getPointAtLength( this.len * percent/100 );
  },

  updatePath : function(path){
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('d', path);
    this.len = this.path.getTotalLength();
  }
};