var Bubble = function(scope) {
  var self = this;
  self.scope = scope;
  Loader.whenAvailable('jQuery', function() {
    self.initialize();
  });
}

Bubble.generateID = function(jsonID) {
  if (Bubbles.ids.indexOf(jsonID) >= 0) { // duplicate ID
    if (!Bubbles.dupeIDs.hasOwnProperty(jsonID)) {
      Bubbles.dupeIDs[jsonID] = {count: 1};
    }
    Bubbles.dupeIDs[jsonID].count += 1;
    return jsonID + Bubbles.dupeIDs[jsonID].count;
  } else {
    Bubbles.ids.push(jsonID);
    return jsonID;
  }
}

Bubble.visibleTypes = function(visible, all) {
  
  if (visible.length == 0) return all;
  
  var arr1 = visible.split(',');
  var arr2 = all;
  
  var commonValues = [];
  var i, j;
  var arr1Length = arr1.length;
  var arr2Length = arr2.length;

  for (i = 0; i < arr1Length; i++) {
      for (j = 0; j < arr2Length; j++) {
          if (arr1[i] === arr2[j]) {
              commonValues.push(arr1[i]);
          }
      }
  }
  
  return commonValues;
  
}

Bubble.prototype = {
  
  initialize: function(scope) {
    var self = this;
    if (self.scope.unsupported) return false;
    self.style();
    if (self.scope.mode != 'ambient') {
      self.addIcons();
      self.setHoverEvent();
    }
    if (self.scope.motion) self.startFloating();
  },
  
  setClasses: function() {
    var self = this;
    self.containerClass = '.bubble';
    self.bubbleClass = self.containerClass+'--photo';
    self.labelClass = self.containerClass+'--label';
    self.iconClass = self.containerClass+'--icon';
    self.flyoutClass = self.containerClass+'--flyout';
  },
  
  setDivs: function() {
    var self = this;
    self.container = $('#'+self.scope.itemID);
    self.bubbles = $(self.bubbleClass, self.container);
    self.bubble = self.activeBubble();
    self.labels = $(self.labelClass, self.container);
    self.label = $(self.labelClass, self.bubble);
    
    $.each(self.scope.types, function(index, type) {
      if (type != self.scope.current) {
        var subBubble = self.selectByType(type);
        subBubble.addClass(self.flyoutClass.substring(1));
      }
    });
    
    self.subBubbles = $(self.flyoutClass, self.container);
  },
  
  place: function() {
    var self = this;
    var placed = false;
    var buffer = 60;
    var numTries = 0;
    var maxTries = 3000;
    while (!placed && numTries < maxTries) {
      var randLeft = Math.random() * ($(window).width() - self.size-buffer);
      var randTop = Math.random() * ($(window).height() - self.size-buffer);
      var randBottom = randTop + self.size+buffer;
      var randRight = randLeft + self.size+buffer;
      var collision = false;
      $('.bubble').each(function() {
        var left = $(this).offset().left;
        var top = $(this).offset().top;
        var bottom = top + self.size+buffer;
        var right = left + self.size+buffer;
        var overlap = !(right < randLeft || 
                        left > randRight || 
                        bottom < randTop || 
                        top > randBottom);
        if (overlap) collision = true;
      });
      if (!collision) {
        //console.log('place found!');
        placed = true;
        self.position = {x: randLeft, y: randTop};
      }
      numTries++;
    }
  },
  
  style: function() {
    var self = this;
    
    self.setClasses();
    self.setDivs();
    
    self.size = parseInt(self.scope.size);
    self.borderSize = self.size / 10;
    self.labelTop = self.size * 0.9;
    self.containerSize = self.size + self.borderSize*6;
    
    //self.place();
  
    var emptyBox = Placement.findAvailable(self.containerSize);
    //console.log(emptyBox);
    self.box = emptyBox.box;
    self.position = emptyBox.pos;
    
    if (!self.position) return false;
    
    self.container.css({
      width: self.containerSize,
      height: self.containerSize,
      left: self.position.x,
      top: self.position.y,
      display: 'inline-block'
    });
    
    self.bubbles.css({
      width: self.size,
      height: self.size,
      borderRadius: self.size,
      borderWidth: self.borderSize,
      top: self.borderSize*2
    });
    
    self.labels.css({
      fontSize: self.borderSize+'px',
      lineHeight: self.borderSize+'px',
      top: self.labelTop,
      borderRadius: self.borderSize/2
    });
    
    self.bubble.show();
  },
  
  parseServices: function() {
    var self = this;
    self.sameAs = {};
    $.each(self.scope.types, function(index, type) {
      var node = self.scope[type.toLowerCase()];
      if (node.hasOwnProperty('schema:sameAs')) {
        self.sameAs[type] = node['schema:sameAs'];
      } else {
        self.sameAs[type] = [];
      }
    });
  },
  
  addIcons: function() {
    var self = this;
    
    $(self.iconClass, self.bubble).remove();
    
    self.parseServices();
    
    $.each(BubbleServices, function(serviceName, service) {
      $.each(self.sameAs, function(type, urls) {
        $.each(urls, function(index, url) {
          if (url.indexOf(service.keyString) > -1) { // has service
            // create icon element
            var icon = $('<a class="'+self.iconClass.substring(1)+'" />');
            icon.data('service', serviceName);
            icon.data('url', url);
            icon.attr({
              'href': url,
              'target': '_blank'
            });
            // set image
            if (service.hasOwnProperty('image')) {
              icon.css('background-image', 'url('+service.image+')');
              Loader.preloadImages(service.image);
            } else {
              icon.addClass(self.iconClass+'-naked');
              icon.html(serviceName.substr(0,2));
            }
            // set tooltip
            var tooltip = BubbleServices.defaultTooltip;
            if (service.hasOwnProperty('tooltip')) {
              tooltip = service.tooltip;
            }
            tooltip = tooltip.replace('{{name}}', self.name(type));
            tooltip = tooltip.replace('{{service}}', serviceName);
            icon.attr({
              'uib-tooltip': tooltip,
              'tooltip-placement': 'top',
              'tooltip-append-to-body': true
            });
            // bind tooltip unhover handler
            icon.bind('mouseleave.tooltip', function() {
              setTimeout(function() {
                self.checkHover();
              }, 200);
            });
            // add to bubble
            //console.log('Adding icon to ' + type);
            icon.appendTo(self.selectByType(type));
          }
        });
      });
    });
  },
  
  getIconPosition: function (angle) {
    var self = this;
    
    function toRad(angle) {
      return angle * (Math.PI / 180);
    }

    var d = self.size;
    var r = d/2;
    var rPad = self.newBorder/2;
    var x = r * Math.sin(toRad(angle));
    var y = r * Math.cos(toRad(angle));
    var xPad = rPad * Math.sin(toRad(angle));
    var yPad = rPad * Math.cos(toRad(angle));
    var left = r + x + xPad - self.iconSize/2;
    var top = r - y - yPad - self.iconSize/2;
    return {'left':left, 'top':top};
  },
  
  setIconCSS: function(icon, angle) {
    var self = this;
    var pos = self.getIconPosition(angle);
    icon.css({
      width: self.iconSize+'px',
      height: self.iconSize+'px',
      lineHeight: self.iconSize+'px',
      left: pos.left+'px', top: pos.top+'px',
      borderRadius: self.iconSize+'px'
    });
    return icon;
  },
  
  revealIcons: function() {
    var self = this;
    var angle = -15;
    var delta = 30;
    var delay = 0;
    self.icons().each(function() {
      icon = self.setIconCSS($(this), angle);
      icon.delay(delay).fadeIn(300);
      angle += delta;
      delay += 50;
    });
  },
  
  setHoverAnimation: function() {
    var self = this;
    
    self.borderIncrease = self.borderSize * 2;
    self.newBorder = self.borderSize + self.borderIncrease;
    self.newSize = self.size + self.borderIncrease*2;
    self.iconSize = self.newBorder * 0.8;

    self.hoverAnimation = {
      borderWidth: self.newBorder+'px',
      top: '-='+self.borderSize*2+'px'
    };
    
    self.cssReset = {
      borderWidth: self.borderSize+'px',
      top: self.borderSize*2,
    }
  },
  
  setHoverEvent: function() {
    var self = this;
    
    self.bubble.unbind('mouseenter mouseleave');

    self.setHoverAnimation();
    
    self.bubble.hover(function() {
      
      if (self.bubble.hasClass('hover')) return false;
      
      Bubbles.active = true;
      self.stopFloating();
      self.animateFlyouts();
      self.allOtherBubbles().fadeTo(150, 0.2);
      
      self.bubble.addClass('hover');
      self.label.css({backgroundColor: 'transparent'});
      self.label.animate({
        top: self.size + (self.borderSize/3) + 'px'
      }, 300);
      
      self.bubble.animate(self.hoverAnimation, 300, function() {
        if (self.bubble.hasClass('hover')) {
          self.revealIcons();
        }
      });
      
    }, function() { // unhover
      
      if ($('.tooltip:hover').length > 0) return false;
      
      self.bubble.finish();
      self.label.finish();
      self.icons().finish();
      self.bubble.removeClass('hover');
      
      self.icons().hide();
      self.bubble.css(self.cssReset);
      self.label.css({
        backgroundColor: 'black',
        top: self.labelTop
      });
      
      self.allOtherBubbles().finish();
      self.allOtherBubbles().css({opacity: 1.0});
      self.resumeFloating();
      Bubbles.active = false;
      
      self.subBubbles.finish();
      self.subBubbles.hide();
      
      //Connections.redraw();
      
    });
  },
  
  animateFlyouts: function() {
    var self = this;
    
    var bubblePos = self.bubble.offset();
    var subLeftStart = (self.container.width() - self.bubble.width()) / 2;
    var subLeftEnd = bubblePos.left - (self.size / 2);
    var subTopDirection = '+=';
    if (bubblePos.top > $(window).height()/2) {
      subTopDirection = '-=';
    }
    var subTopShift = self.size + self.borderSize*3;
    var subLeftIncrement = self.size + self.borderSize*2;
    if (self.subBubbles.length > 2) subLeftStart -= subLeftIncrement/2;
    
    $.each(self.subBubbles, function(index, subBubble) {
      subBubble = $(subBubble).detach().appendTo('body');
      subBubble.show();
      subBubble.css({
        position: 'absolute',
        zIndex: -1,
        top: bubblePos.top+self.borderSize,
        left: bubblePos.left+self.borderSize,
        borderWidth: 0,
        opacity: 0.2
      });
      subBubble.animate({
        top: subTopDirection+subTopShift+'px',
        left: subLeftEnd,
        opacity: 0.9
      }, 300, function(){
        $(this).css({zIndex: 100});
      });
      subLeftEnd += subLeftIncrement;
    });
  },
  
  startFloating: function() {
    var self = this;
    var motionClasses = ['forward-motion', 'backward-motion'];
    var motionClass = motionClasses[Math.floor(Math.random()*motionClasses.length)];
    var delay = Math.random()*10;
    self.container.css({animationDelay: '-'+delay+'s'});
    self.container.addClass(motionClass);
  },
  
  stopFloating: function() {
    var self = this;
    self.container.css('-webkit-animation-play-state', 'paused');
    self.container.css('animation-play-state', 'paused');
  },
  
  resumeFloating: function() {
    var self = this;
    self.container.css('-webkit-animation-play-state', 'running');
    self.container.css('animation-play-state', 'running');
  },
  
  checkHover: function() {
    var self = this;
    if ($(self.bubbleClass+':hover', self.container).length == 0) {
      self.bubble.trigger('mouseleave');
    }
  },
  
  selectByType: function(type) {
    var self = this;
    var selector = self.bubbleClass+'[data-type="'+type+'"]';
    var div = $(selector, self.container);
    return div;
  },
  
  activeBubble: function() {
    var self = this;
    return self.selectByType(self.scope.current);
  },
  
  allOtherBubbles: function() {
    var self = this;
    return $(self.bubbleClass+':not('+self.flyoutClass+')').not(self.bubble);
  },
  
  name: function(type) {
    var self = this;
    return self.selectByType(type).data('name');
  },
  
  icons: function() {
    var self = this;
    return $(self.iconClass, self.activeBubble());
  },
  
  removed: function() {
    var self = this;
    //console.log('this bubble removed');
    if (self.position) Placement.boxNowEmpty(self.box);
  }
  
}


var BubbleServices = {
  
  defaultTooltip: "Visit {{name}} on {{service}}",
  
  Twitter: {
    keyString: 'twitter.com',
    image: 'images/icons/twitter.png',
    tooltip: "See {{name}}'s tweets"
  },
  
  LinkedIn: {
    keyString: 'linkedin.com',
    image: 'images/icons/linkedin.png'
  },
  
  Instagram: {
    keyString: 'instagram.com',
    image: 'images/icons/instagram.png'
  },
  
  Facebook: {
    keyString: 'facebook.com',
    image: 'images/icons/facebook.png'
  }
  
}


var Bubbles = {
  
  active: false,
  ids: [],
  dupeIDs: {},
  
  areActive: function() {
    var self = this;
    return self.active;
  },
  
  remove: function(id) {
    //console.log('removed ' + id);
  }
  
}

Array.prototype.random = function(v) {
  var item = this[Math.floor(Math.random()*this.length)];
  return item;
};

var Placement = {
  
  initialized: false,
  buffer: 1.1, maxNoise: 15.0,
  origSize: 0, size: 0,
  numRows: 0, numCols: 0,
  spareX: 0, spareY: 0,
  emptyBoxes: [],
  
  initialize: function(size) {
    var self = this;
    if (self.initialized) return true;
    self.origSize = size;
    self.size = size*self.buffer;
    self.setEmptyBoxes();
    self.setNoise();
    self.initialized = true;
  },
  
  setNoise: function() {
    var self = this;
    var multiplier = (self.buffer - 1.0);
    self.maxNoise = multiplier * self.size;
  },
  
  setEmptyBoxes: function() {
    var self = this;
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    self.numRows = Math.floor(windowHeight / self.size);
    self.numCols = Math.floor(windowWidth / self.size);
    for (var row = 0; row < self.numRows; row++) {
      for (var col = 0; col < self.numCols; col++) {
        self.emptyBoxes.push({row, col});
      }
    }
    self.spareX = windowWidth - (self.size * self.numCols);
    self.spareY = windowHeight - (self.size * self.numRows);
  },
  
  findEmptyBox: function() {
    var self = this;
    var randomBox = self.emptyBoxes.random();
    // remove from array
    var index = self.emptyBoxes.indexOf(randomBox);
    self.emptyBoxes.splice(index, 1);
    return randomBox;
  },
  
  plusOrMinus: function() {
    return Math.random() < 0.5 ? -1 : 1;
  },
  
  convertToPosition: function(box) {
    var self = this;
    var left = box.col * self.size;
    var top = box.row * self.size;
    left += self.spareX * 0.6 * ((box.col+1) / self.numCols);
    top += self.spareY * 0.6 * ((box.row+1) / self.numRows);
    left += self.plusOrMinus() * Math.random() * self.maxNoise;
    top += self.plusOrMinus() * Math.random() * self.maxNoise;
    return {x: left, y: top};
  },
  
  findAvailable: function(size) {
    var self = this;
    self.initialize(size);
    if (self.emptyBoxes.length == 0) { // no more room!
      return false;
    }
    var box = self.findEmptyBox();
    var pos = self.convertToPosition(box);
    return {box, pos};
  },
  
  boxNowEmpty: function(box) {
    var self = this;
    self.emptyBoxes.push(box);
  }
  
  
  
}


var Loader = {
  
  loaded: {},
  
  getJQuery: function() {
    var script = document.createElement('script');
    script.src = '//code.jquery.com/jquery-3.1.0.min.js';
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);
  },
  
  getFonts: function() {
    var font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Open+Sans:400,600,700,300';
    font.rel = 'stylesheet';
    font.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(font);
  },
  
  whenAvailable: function(name, callback) {
    var self = this;
    var interval = 10; // ms
    window.setTimeout(function() {
      if (window[name]) {
        if (!self.loaded.hasOwnProperty(name)) { // first load
          self.afterLoad(name);
          self.loaded[name] = true;
        }
        callback(window[name]);
      } else {
        window.setTimeout(arguments.callee, interval);
      }
    }, interval);
  },
  
  preloadImages: function() {
    for (var i = 0; i < arguments.length; i++) {
      var img = new Image();
      img.src = arguments[i];
    }
  },
  
  afterLoad: function(name) {
    //console.log('initing after ' + name);
    switch(name) {
      case 'jQuery':
        (function($){
          $.event.special.destroyed = {
            remove: function(o) {
              if (o.handler) {
                o.handler()
              }
            }
          }
        })(jQuery);
        Compiler.initialize();
        break;
    }
  }
  
}


var AngularCompile;

var Compiler = { // need Angular to recompile new elements after DOM manipulation
  
  initialized: false,
  
  initialize: function() {
    var self = this;
    
    if (self.initialized) return true;
    
    oldPrepend = $.fn.prepend;
    $.fn.prepend = function()
    {
      var isFragment =
        arguments[0][0] && arguments[0][0].parentNode
        && arguments[0][0].parentNode.nodeName == "#document-fragment";
      var result = oldPrepend.apply(this, arguments);
      if (isFragment)
      AngularCompile(arguments[0]);
      return result;
    };
    
    oldAppend = $.fn.append;
    $.fn.append = function()
    {
      var isFragment =
        arguments[0][0] && arguments[0][0].parentNode
        && arguments[0][0].parentNode.nodeName == "#document-fragment";
      var result = oldAppend.apply(this, arguments);
      if (isFragment)
      AngularCompile(arguments[0]);
      return result;
    };

    AngularCompile = function(root)
    {
      var injector = angular.element($('[ng-app]')[0]).injector();
      var $compile = injector.get('$compile');
      var $rootScope = injector.get('$rootScope');
      var result = $compile(root)($rootScope);
      $rootScope.$digest();
      return result;
    }
    
    self.initialized = true;
  }
  
}


Loader.getJQuery();
Loader.getFonts();
