/**
 * Copyright reelyActive 2016-2017
 * We believe in an open Internet of Things
 */


HAS_CHAMPAGNE = (typeof CHAMPAGNE_ROOT != 'undefined');
if(HAS_CHAMPAGNE) {
  ASSET_ROOT = CHAMPAGNE_ROOT + 'social/icons/';
}
else {
  ASSET_ROOT = 'social/icons/';
}

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

Bubble.overlayActive = function() {
  if ($('.overlay').length > 0) {
    return true;
  } else {
    return false;
  }
};

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
  
  style: function() {
    var self = this;
    
    self.setClasses();
    self.setDivs();
    
    self.size = parseInt(self.scope.size);
    self.borderSize = self.size / 10;
    self.labelTop = self.size * 0.9;
    self.flyoutOpacity = 0.9;
    
    if (self.scope.placement == 'linear') {
      self.containerSize = self.size + self.borderSize*4;
    } else {
      self.containerSize = self.size + self.borderSize*6;
    }
    
    var containerCSS = {
      width: self.containerSize,
      height: self.containerSize,
      display: 'inline-block'
    }
    
    if (self.scope.placement != 'linear') {
      var emptyBox = Placement.findAvailable(self.containerSize);
      self.box = emptyBox.box;
      self.position = emptyBox.pos;

      if (!self.position) return false;
      
      containerCSS.left = self.position.x;
      containerCSS.top = self.position.y;
      containerCSS.position = 'absolute';
    }
    
    self.container.css(containerCSS);
    
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
            // set overlay or href
            var hasBottlenose = true;
            try {
              angular.module('reelyactive.bottlenose');
            } catch(err) {
              hasBottlenose = false;
            }
            if (service.hasOwnProperty('overlay') && hasBottlenose) {
              icon.click(function(event) {
                icon.toggleClass('active');
                if (icon.hasClass('active')) {
                  self.showOverlay(serviceName, url, event);
                } else {
                  self.closeOverlay();
                }
              });
            } else {
              icon.attr({
                'href': url,
                'target': '_blank'
              });
            }
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
  
  showOverlay: function(serviceName, url, clickEvent) {
    var self = this;
    
    clickEvent.stopPropagation();
    
    self.overlay = $('<div class="overlay"></div>');
    var overlayLoader = $('<div class="overlay--loader">Loading...</div>');
    overlayLoader.appendTo(self.overlay);
    self.overlayArrow = $('<div class="arrow"></div>');
    
    $('body').append(self.overlay);
    $('body').append(self.overlayArrow);
    
    var bubblePos = self.bubble.offset();
    var arrowWidth = 32;
    var arrowTop =
      bubblePos.top
      + self.bubble.outerHeight()/2
      - 20;
    
    if (bubblePos.left < $(window).width()/2) { // overlay right of bubble
      
      var overlayLeft =
        bubblePos.left
        + self.container.width()
        - arrowWidth/3;
        
      self.overlayArrow.css({
        left: overlayLeft - arrowWidth,
        top: arrowTop,
        borderRight: arrowWidth+'px solid white',
        borderLeft: 'none'
      });
      
    } else { // overlay left of bubble
      
      var overlayLeft =
        bubblePos.left
        - self.overlay.width()
        + arrowWidth/3;
        
      self.overlayArrow.css({
        left: overlayLeft + self.overlay.width(),
        top: arrowTop,
        borderLeft: arrowWidth+'px solid white',
        borderRight: 'none'
      });
    }
    
    var overlayTop =
      bubblePos.top
      + self.bubble.outerHeight()/2
      - self.overlay.outerHeight()/2;
    
    self.overlay.css({
      left: overlayLeft+'px',
      top: overlayTop+'px'
    });
    
    self.setOverlayCloseEvent();
    
    self.fillOverlay(serviceName, url);
  },
  
  fillOverlay: function(serviceName, url) {
    var self = this;
    
    var overlayContainer = $('<div><'+serviceName+'></'+serviceName+'></div>');
    self.overlayContent = $(serviceName, overlayContainer);
    self.overlayContent.attr({url: "'"+url+"'"});
    self.overlayContent.hide();
    
    $('.overlay').append(overlayContainer);
    
    self.overlayContent.on('ready', function() {
      self.openOverlay();
    });
  },
  
  openOverlay: function() {
    var self = this;
    
    var margin = 20;
    
    var css = {
      top: margin,
      height: $(window).height() - margin*2
    }
    
    $('.overlay--loader').fadeOut(300, function() {
      self.overlay.animate(css, 500, function() {
        self.overlayContent.show();
        $('.overlay--content').fadeTo(300, 1.0, function() {
          self.setOverlayCloseEvent();
        });
      });
    });
  },
  
  setOverlayCloseEvent: function() {
    var self = this;
    self.overlayCloseClick = $(document).click(function(event) { 
      if(!$(event.target).closest('.overlay').length) {
        self.closeOverlay();
        if (!$(event.target).closest(self.bubble).length) {
          self.bubble.trigger('mouseout');
        }
      }        
    });
  },
  
  closeOverlay: function() {
    var self = this;
    self.overlayCloseClick.off();
    self.overlay.remove();
    self.overlayArrow.remove();
    self.icons().removeClass('active');
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
      
      if (Bubble.overlayActive()) return false;
      if (self.bubble.hasClass('hover')) return false;
      
      Bubbles.active = true;
      self.stopFloating();
      self.animateFlyouts();
      self.allOtherBubbles().css({opacity: 0.2});
      
      self.bubble.addClass('hover');
      self.label.css({backgroundColor: 'transparent'});
      self.label.animate({
        top: self.size + (self.borderSize/3) + 'px'
      }, 200);
      
      self.bubble.animate(self.hoverAnimation, 200, function() {
        if (self.bubble.hasClass('hover')) {
          self.revealIcons();
        }
      });
      
    }, function() { // unhover
      
      if (Bubble.overlayActive()) return false;
      if ($('.tooltip:hover').length > 0) return false;
      
      self.bubble.finish();
      self.label.finish();
      self.icons().finish();
      self.bubble.removeClass('hover');
      
      $('.overlay').remove();
      
      self.icons().hide();
      self.bubble.css(self.cssReset);
      self.label.css({
        backgroundColor: 'black',
        top: self.labelTop
      });
      
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
        zIndex: 1,
        top: bubblePos.top+self.borderSize,
        left: bubblePos.left+self.borderSize,
        borderWidth: 0,
        opacity: self.flyoutOpacity
      });
      subBubble.animate({
        top: subTopDirection+subTopShift+'px',
        left: subLeftEnd
      }, 200, function(){
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
    image: ASSET_ROOT+'twitter.png',
    tooltip: "See {{name}}'s tweets",
    overlay: true
  },
  
  LinkedIn: {
    keyString: 'linkedin.com',
    image: ASSET_ROOT+'linkedin.png'
  },
  
  Instagram: {
    keyString: 'instagram.com',
    image: ASSET_ROOT+'instagram.png'
  },
  
  Facebook: {
    keyString: 'facebook.com',
    image: ASSET_ROOT+'facebook.png'
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
    var container = $('#bubbles');
    if (container.length == 0) {
      container = $(window);
    } else {
      container.css({position: 'relative'});
    }
    var windowHeight = container.height();
    var windowWidth = container.width();
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
      var injector = angular.element(document).injector();
      if (typeof injector == 'undefined') {
        injector = angular.element($('[ng-app]')[0]).injector();
      }
      var $compile = injector.get('$compile');
      var $rootScope = injector.get('$rootScope');
      var result = $compile(root)($rootScope);
      $rootScope.$digest();
      return result;
    }
    
    self.initialized = true;
  }
  
}
