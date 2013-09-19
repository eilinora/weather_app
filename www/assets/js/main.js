(function($, global){

  //for debugging - don't trip up IE7
  if(!window.console){
    console = {
      log : function(){}
    };
  }
  //storing breakpoints here for use by modules
  var breakpoints = {
    mobile: 0,
    tablet: 600,
    desktop: 960
  };

  var config = {};
  //caching $body to be used throughout the script
  $.$body = $('body');
  $.$window = $(window);
  $.support.geolocation = ('geolocation' in navigator ) && ( _.isFunction( navigator.geolocation.getCurrentPosition ) );
  $.support.localStorage = ('localStorage' in window ) && ( _.isFunction( localStorage.setItem ) );
  $.support.touch = 'ontouchstart' in window;
  


  /**
   * Lets check if the sr object exits, if not create one
   */
  global.rodeo = global.rodeo || {};

  /**
   * Creates the application controller which handles and
   * page routing to code packages or utility calls
   */
  rodeo.Main  = (function () {
    /**
     * Stores instance of our AppController
     */
    var instance;
    /**
     * Stores all private methods to the AppRouter so that no other
     * @return {Object} Returns any public methods being exposed
     */
    var initialize = function () {
      /**
       * reference to the canvas stage
       */
      var stage, stageWidth = 900, stageHeight = 600,
          sky,
          currentCondition = null,
          $fps,
          ticker,
          CANVAS = 'app',
          DEFAULT_CONDITION = 'raining',
          DEFAULT_DAY_PHASE = 'daytime',
          $canvas = $('#'+CANVAS);



      //adds global listeners used by the site
      var addListeners = function() {
          $(window).on('resize', _.bind( onResize, this) );
        }, //end: addListeners

        setStage = function () {
          stage = new createjs.Stage(CANVAS);
          $fps = $('#fps');
          //
          //seting up framerate for canvas obj
          ticker = createjs.Ticker;
          ticker.setFPS(30);
          ticker.addEventListener('tick', tick.bind(this));
        },

        tick = function () {
          stage.update();
          $fps.html(Number(ticker.getMeasuredFPS()) + " fps");
          //rodeo.views.conditions.updateFallingItems();
        },
        createCondition = function (conditionType) {
          conditionType = (conditionType === undefined) ? DEFAULT_CONDITION : conditionType;
          
          createWeather(conditionType);
        },

        createWeather = function (conditionType) {
          switch (conditionType) {
            case 'raining':
              condition = new rodeo.views.conditions.Raining();
              break;
            case 'snowing':
              condition = new rodeo.views.conditions.Snowing();
              break;
            default: //sunny
              condition = new rodeo.views.condition.BaseCondition();
          }
          condition.create(DEFAULT_DAY_PHASE);
          stage.addChild(condition.getScene());

          currentCondition = condition;
        },

        onResize = function () {
          var ct = $canvas.get(0).getContext('2d');
          $canvas.attr('width', $.$window.width());
          $canvas.attr('height', $.$window.height());
          
          stageWidth = $.$body.width();
          stageHeight = $.$body.height();
          
          if (currentCondition !== null) {
            currentCondition.resize();
          }

          stage.update();
        }; //end: on_resize

        /**
         * Returns any public facing functions for this class
         */
        return {
          
          init: function () {
            setStage(); //TODO:why can't i use getStage() in private functions?? Or better question, what is a good strategy for this issue...

            //add app listeners
            addListeners();

            //do an initial resize call to set stage props
            onResize();
            //$canvas.attr('width', $canvas.width());
            //$canvas.attr('height', $canvas.height());

            //start the weather...
            createCondition();

            
            //init weather app
            rodeo.models.OpenWeatherApi.init();
          },

          getStage: function () {
            if (stage === undefined) {
              setStage();
            }
            return stage;
          },

          getStageWidth: function () {
            return stageWidth;
          },
          getStageHeight: function () {
            return stageHeight;
          },


          getUserLocation: function () {
            rodeo.models.LocationServices.requestLocation().done ( function (data) {
              console.log (data);
            });
          }


        };
    }; //end: initialize

    return {
      /**
       * Get an instance of our AppRouter for use
       * @return {Object} Instance of AppRouter Class
       */
      getInstance : function () {
        if ( ! instance ) {
          instance = initialize();
        }

        return instance;
      } //end: getInstance

    };
  })();

  

  //-------------------------
  //
  // BEGIN: Views
  //
  //-------------------------
  rodeo.views = {};

  //SKY SCENE
  rodeo.views.Sky = function () {};
  $.extend(rodeo.views.Sky.prototype, {
    el: null,
    current : null,
    next : null,
    dayPhase: 'daytime',
    conditionType: 'sunny',

    create: function (condition, dayPhase) {
      this.el = new createjs.MovieClip();

      this.setCondition(condition);
      this.setDayPhase(dayPhase);

      if (this.getDayPhase() === 'daytime') {
        this.current = new createjs.Shape();
        this.createDaytime(this.current);
      } else {
        this.current = new createjs.Shape();
        this.createDaytime(this.current);
      }

      this.el.addChild(this.current);
    },

    createDaytime: function (container) {
      var colors = this.getColors(this.getCondition()),
          sky = container,
          stageWidth = rodeo.Main.getInstance().getStageWidth(),
          stageHeight = rodeo.Main.getInstance().getStageHeight();
      sky.graphics.beginRadialGradientFill(colors, 
                                           [0, 0.1, 0.14, 1],
                                           stageWidth, 0, 0, stageWidth, 0, stageWidth*0.75)
                  .drawRect(0, 0, stageWidth, stageHeight);
      sky.cache(0, 0, stageWidth, stageHeight);
      return sky;
    },

    createNightTime: function () {

    },

    getColors: function (condition) {
      if (condition !== 'sunny') {
          return ['#e79a66', '#ffb950', '#b7b5ba', '#7f8085'];
      } else {
          return ['#ffcc00', '#ffe54c', '#ffff99', '#237acb'];
      }
    },


    setCondition: function (v) {
      this.conditionType = v;
    },
    getCondition: function () {
      return this.conditionType;
    },

    setDayPhase: function (v) {
      this.dayPhase = v;
    },
    getDayPhase: function () {
      return this.dayPhase;
    },

    resize: function () {
      if (this.current !== null) {
        this.current.graphics.clear();

        if (this.getDayPhase() === 'daytime') {
          this.createDaytime(this.current);
        } else {
          this.createDaytime(this.current);
        }

        this.current.updateCache();
      }
    },

    getScene: function () {
      return this.el;
    }
  });

  //CLOUDS SCENE
  rodeo.views.Clouds = function () {};
  $.extend(rodeo.views.Clouds.prototype, {
    el: null,
    intensity : 1,

    create: function (condition) {
      this.el = new createjs.MovieClip();

      this.setCondition(condition);      
      this.el.addChild(this.current);
    },

    update: function () {

    },

    setCondition: function (v) {
      this.conditionType = v;
      switch(this.conditionType) {
        case 'snowing':
        case 'raining':
          this.setIntensity(5);
          break;
        default:
          this.setIntensity(1);
      }
    },
    getCondition: function () {
      return this.conditionType;
    },

    setIntensity: function (v) {
      this.intensity = v;
    },
    getIntensity: function() {
      return this.intensity;
    },

    resize: function () {
      //update clouds tween
    },

    getScene: function () {
      return this.el;
    }
  });

  rodeo.views.BaseAnimatedElement = function () {};
  createjs.EventDispatcher.initialize(rodeo.views.BaseAnimatedElement.prototype);
  rodeo.views.BaseAnimatedElement.prototype._super = rodeo.views.BaseAnimatedElement.prototype;
  $.extend(rodeo.views.BaseAnimatedElement.prototype, {
    el: null,
    speed: 0,
    width: 0,
    minSize: 0,
    maxSize: 0,
    speed: 15,
    easeType: 'linear',

    create: function () {
      var item = this.draw();
      item.x = Math.random() * rodeo.Main.getInstance().getStageWidth();
      item.y = -20;
      this.setDisplayObject(item);
      return item;
    },

    draw: function () {}, //individual item should be drawn in subclass

    animate: function () {
      TweenLite.to(this.getDisplayObject(), this.getAniLength(), { 
            y : rodeo.Main.getInstance().getStageHeight(), 
            ease: this.getEaseType(), 
            onComplete: _.bind(function () {
                                this.remove();
                              }, this) 
          });
    },

    add: function () {
      this.dispatchEvent('item:add');
    },
    remove: function () {
      //console.log(this);
      //console.log('remove');
      this.dispatchEvent('item:remove');
    },

    getAniLength: function () {
      return (((this.getMaxSize() + this.getMinSize()) - this.getWidth())/(this.getMaxSize() + this.getMinSize()) * this.getSpeed()) + 1;
    },

    setWidth: function (v) {
      this.width = v;
    },
    getWidth: function () {
      return this.width;
    },

    setDisplayObject: function (v) {
      this.el = v;
    },
    getDisplayObject: function() {
      return this.el;
    },

    setMaxSize: function (v) {
      this.maxSize = v;
    },
    getMaxSize: function () {
      return this.maxSize;
    },

    setMinSize: function (v) {
      this.minSize = v;
    },
    getMinSize: function () {
      return this.minSize;
    },

    setSpeed: function (v) {
      this.speed = v;
    },
    getSpeed: function () {
      return this.speed;
    },

    setEaseType: function (v) {
      this.easeType = v;
    },
    getEaseType: function () {
      return this.easeType;
    },

    getStage: function () {
      return rodeo.Main.getInstance().getStage();
    }

  });

  rodeo.views.SnowFlake = function () {
    this.setSpeed(30);
    this.setMinSize(2);
    this.setMaxSize(18);
    this.setEaseType('linear');
  };
  rodeo.views.SnowFlake.prototype = new rodeo.views.BaseAnimatedElement();
  $.extend(rodeo.views.SnowFlake.prototype, {

    draw: function () {
      var flake,
          s = Math.random()*this.getMaxSize()+this.getMinSize();
      
      this.setWidth(s);

      flake = new createjs.Shape();
      flake.graphics.beginStroke('white').beginFill('rgba(255,255,255,0.75)');
      flake.graphics.drawPolyStar(0, 0, s, 8, 0.65, -100);
      flake.cache(-s, -s, s*2, s*2);

      return flake;
    }

  });

  rodeo.views.RainDrop = function () {
    this.setSpeed(8);
    this.setMaxSize(16);
    this.setMinSize(4);
  };
  rodeo.views.RainDrop.prototype = new rodeo.views.BaseAnimatedElement();
  $.extend(rodeo.views.RainDrop.prototype, {
    draw: function () {
      var drop = new createjs.Shape(),
          s = Math.random()*this.getMaxSize()+this.getMinSize(),
          m = s/2,
          t = s/3;
      this.setWidth(s);
      
      drop.graphics.beginStroke('rgba(76,240,255,0.5)').beginFill('rgba(132,184,255,0.25)');
      drop.graphics.moveTo(0, 0).lineTo(-t, m).quadraticCurveTo(-m, s, 0, s)
                   .moveTo(0,0).lineTo(t, m).quadraticCurveTo(m, s, 0,s);
      drop.cache(-s, -s, s*2, s*2);

      return drop;
    }

  });

  rodeo.views.conditions = {
    updateFallingItems: function (intensity, wind, type) {
      var drop, tY, w,
          maxWidth = 20,
          stage = rodeo.Main.getInstance().getStage(),
          stageWidth = rodeo.Main.getInstance().getStageWidth(),
          stageHeight = rodeo.Main.getInstance().getStageHeight()+40,
          i = 0,
          ani = 0,
          speed = 15,
          q = (intensity === undefined) ? 5 : intensity,
          a = (wind === undefined) ? 10 : wind;
        type = (type === undefined) ? 'rain' : type;

        for (i = 0; i < q; i++) {
          //generates a random y position for element
          //tY = Math.random() * stageHeight;
          w = Math.random()*maxWidth+2;
          ani = (maxWidth-w)/maxWidth * speed;
          switch (type) {
            case 'snow':
              drop = rodeo.utils.Draw.rainDrop(w);
              break;
            default:
              drop = rodeo.utils.Draw.snowFlake(w);
              
          }
          drop.x = Math.random() * stageWidth;
          drop.y = -20;
          stage.addChild(drop);

          TweenLite.to(drop, ani, { y : stageHeight, ease: 'linear', onComplete: function () {
            stage.removeChild(drop);
          }});
      }
    }
  };

  rodeo.views.conditions.BaseCondition = function () {};
  //createjs.EventDispatcher.initialize(rodeo.views.conditions.BaseCondition.prototype);
  rodeo.views.conditions.BaseCondition.prototype._super = rodeo.views.conditions.BaseCondition.prototype;
  $.extend(rodeo.views.conditions.BaseCondition.prototype, {
    scene: null,
    intensity: 0,
    wind: 0,
    conditionType: 'sunny',
    dayPhase: 'daytime',
    sky: null,

    create: function (dayPhase) {
      var scene = new createjs.MovieClip();
      this.setScene(scene);
      this.setupAnimation();

      this.setDayPhase(dayPhase);
      this.createSky();
    },

    setupAnimation: function() {
      setInterval(_.bind(this.updateScene, this), 150);
    },

    updateScene: function () {
      var i, item,
          intensity = this.getIntensity();

      for (i = 0; i < intensity; i++) {
        item = this.drawItem();
        item.create();
        item.addEventListener('item:remove', this.removeItem.bind(this));
        item.animate();
        this.getScene().addChild(item.getDisplayObject());
      }

      //console.log(this.getScene().getNumChildren());
    },

    createSky: function () {
      this.sky = new rodeo.views.Sky();
      this.sky.create(this.getCondition(), this.getDayPhase());
      this.getScene().addChild(this.sky.getScene());
    },

    createClouds: function () {
      this.clouds = new rodeo.views.Clouds();
      this.clouds.create(this.getCondition());
      this.getScene().addChild(this.clouds.getScene());
    }

    resize: function () {
      if (this.sky !== null) {
        this.sky.resize();
      }
    },

    drawItem: function () {},

    removeItem: function (e) {
      //console.log('remove!');
      //console.log(e);
      this.getScene().removeChild(e.target.getDisplayObject());
    },

    setScene: function (v) {
      this.scene = v;
    },
    getScene: function () {
      return this.scene;
    },

    setIntensity: function (v) {
      this.intensity = v;
    },
    getIntensity: function () {
      return this.intensity;
    },

    setCondition: function (v) {
      this.conditionType = v;
    },
    getCondition: function () {
      return this.conditionType;
    },

    setDayPhase: function (v) {
      if (this.sky !== null) {
        this.sky.setDayPhase(v);
      }
      this.dayPhase = v;
    },
    getDayPhase: function () {
      return this.dayPhase;
    }

  });

  rodeo.views.conditions.Raining = function () {
    this.setIntensity(6);
    this.setCondition('raining');
  };
  rodeo.views.conditions.Raining.prototype = new rodeo.views.conditions.BaseCondition();
  $.extend(rodeo.views.conditions.Raining.prototype, {
    
    drawItem: function () {
      return new rodeo.views.RainDrop();
    }
  });

  rodeo.views.conditions.Snowing = function () {
    this.setIntensity(8);
    this.setCondition('snowing');
  };
  rodeo.views.conditions.Snowing.prototype = new rodeo.views.conditions.BaseCondition();
  $.extend(rodeo.views.conditions.Snowing.prototype, {
    
    drawItem: function () {
      return new rodeo.views.SnowFlake();
    }
  });



  //-------------------------
  //
  // END: Views
  //
  //-------------------------
  //
  //-------------------------
  //
  // BEGIN: Models
  //
  //-------------------------
  rodeo.models = {
    enums: {
      WeatherCodes: {
        THUNDER_W_LIGHT_RAIN: [200],
        THUNDER_W_RAIN: [201],
        THUNDER_W_HEAVY_RAIN: [202],
        THUNDERSTORM: [211],
        THUNDERSTORM_HEAVY: [212, 221],
        THUNDERSTORM_LIGHT: [230, 231, 232],
        DRIZZLE_LIGHT: [300, 301],
        DRIZZLE_HEAVY: [302, 310, 311, 312, 321],
        RAIN_LIGHT: [500, 520, 521],
        RAIN_MODERATE: [501],
        RAIN_HEAVY: [502, 503, 522],
        RAIN_EXTREME: [504],
        RAIN_FREEZING: [511],
        SNOW_LIGHT: [600],
        SNOW: [601],
        SNOW_HEAVY: [602, 621],
        SLEET: [611],
        MIST: [701],
        SMOKE: [711],
        HAZE: [721],
        SAND_WHIRLS: [731],
        FOG: [741],
        CLOUDS_CLEAR: [800],
        CLOUDS_FEW: [801],
        CLOUDS_SCATTERED: [802, 803, 804],
        EXTREME_TORNADO: [900],
        EXTREME_TROPICAL_STORM: [901],
        EXTREME_COLD: [903],
        EXTREME_HOT: [904],
        EXTREME_WINDY: [905],
        EXTREME_HAIL: [906]
      }
    },

    OpenWeatherApi: {
      URI: 'http://api.openweathermap.org/data/2.5/',
      WEATHER_SERVICE: 'weather',
      
      DEFAULT_LOCATION: {
        lat: 40.69847032728747,
        lon: -73.9514422416687
      },

      apiOptions: {
        APPID: '5f3d226a945f78937bb9db3433d57ae0',
        unit: 'imperial'
      },


      init: function () {
        this.setupRequester();
        this.getWeatherConditionByLatLong();
      },

      setupRequester: function () {
        this.ajaxRequest = new rodeo.models.APICaller();
        this.ajaxRequest.addEventListener('ajax:success', _.bind(this.onSuccess, this));
        this.ajaxRequest.addEventListener('ajax:error', _.bind(this.onError, this));
      },

      appendApiOptions: function (params) {
        return _.extend( this.apiOptions, params);
      },

      getWeatherConditionByLatLong: function (pos) {
        var params;
        if (pos === undefined) pos = this.DEFAULT_LOCATION;
        //append any default data need for api call to params
        params = this.appendApiOptions(pos);
        //make the request
        this.ajaxRequest.sendRequest(this.URI + this.WEATHER_SERVICE, pos);
      },

      getWeatherConditionByName: function (city_name) {

      },

      onSuccess: function (data) {
        console.log(data);
      },

      onError: function (data) {

      }

    },

    LocationServices: {
      requestLocation: function () {
        var dfd = new $.Deferred(),
            verified = false,
            timeout = 5000;

        //Lets request the geolocation of this users' browser...
        if ( $.support.geolocation ) { //
          var options = { enableHighAccuracy: true, maximumAge: 600000, timeout: 25000 };
          var watchID = navigator.geolocation.watchPosition(
            _.bind(function (data) {
              var geodata = {
                    geolocation: [ data.coords.longitude, data.coords.latitude ]
                  };
              //
              clearInterval(timeoutInterval);
              navigator.geolocation.clearWatch( watchID );
              console.log('GEO coming from config browser/device: ',geodata);
              //
              if ( !config.userData ) config.userData = {};
              if ( config.userData && !config.userData.geolocation ) {
                _.extend( config.userData, geodata );
              }
              //
              dfd.resolve( [ config.userData.geolocation[ 0 ], config.userData.geolocation[ 1 ] ] );
            }, this),
            _.bind(function(error){
              clearInterval(timeoutInterval);
              navigator.geolocation.clearWatch( watchID );
              
              dfd.resolve(false);
            }, this), options );

          //set an interval to capture if the browser times out capturing the users location,
          //if so, cycle through back up scenraios for getting location
          var timeoutInterval = setTimeout( _.bind(function() {
            navigator.geolocation.clearWatch( watchID );
            if ( !config.userData ) {
              if (config.userData.geolocation) {
                dfd.resolve( config.userData.geolocation );
              }
            } else {
              console.log('ERROR: No location retrieved');
              dfd.resolve(false);
            }
          }, this), 25000 );
        } else {
          //ok there is absolute way for us to predict the
          //users location so just set the serach param to
          //the default location
          console.log('ERROR: Location support not available.');
          dfd.resolve(false);
        }

        return dfd.promise();
      },

      getLocationFromUserData: function (dfd) {
        //do something..
        //
        
        //
        return dfd.resolve();
      }
    }
  };

  
  rodeo.models.APICaller = function () { };
  //adding event dispatcher functionality from CreateJS to object
  createjs.EventDispatcher.initialize(rodeo.models.APICaller.prototype);
  _.extend(rodeo.models.APICaller.prototype, {
    sendRequest: function (URL, params, options) {
      var defaults = {
        method: 'GET',
        dataType: 'jsonp',
        cache: false,
        on_success: false,
        on_error: false,
        scope: this,
        async: true
      },

      //Get our opts
      opts = (options !== undefined) ? _.extend(defaults, options) : defaults;

      //perform request
      return $.ajax( {
        type: opts.method,
        dataType: opts.dataType,
        url: URL,
        cache: opts.cache,
        data : params,
        async: opts.async,
        success: _.bind( function( data ) {
          
          if( data.form_errors ) {
            //opts.on_error.call(opts.scope, data);
            this.dispatchEvent('ajax:error', data);
            return;
          }
          //Success callback
          //console.log('Success!', data); //debugging
          this.dispatchEvent('ajax:success', data);
          //opts.on_success.call(opts.scope, data);
        }, this ),

        error: _.bind( function( data ) {
          console.log('ERROR: ', data);
          //Error callback
          this.dispatchEvent('ajax:error', data);
          //opts.on_error.call(opts.scope, data);
        }, this ),
        fail: _.bind( function( data ) {
          console.log('FAIL: ', data);
          //Error callback
          this.dispatchEvent('ajax:error', data);
          //opts.on_error.call(opts.scope, data);
        }, this )
      } );
    }
  });//end: APICaller
  //-------------------------
  //
  // END: Models
  //
  //-------------------------
  //
  //-------------------------
  //
  // BEGIN: Utilities
  //
  //-------------------------
  rodeo.utils = {
    Temp: {
      convert_kelvin_to_fahrenheit: function (temp) {
        return ((temp - 273) * 1.8 ) + 32;
      }
    },

    Draw: {
      cloud: function (s) {
        if (this.svgFlake === undefined) {
          this.svgFlake = new Image();
          this.svgFlake.src = '/assets/svg/cloud.svg';
        }
        var flake = new createjs.Bitmap(this.svgFlake);
        return flake;
      },

      snowFlake: function (s) {
        if (this.flake === undefined) {
          s = 16;
          this.flake = new createjs.Shape();
          this.flake.graphics.beginStroke('white').beginFill('rgba(255,255,255,0.75)');
          this.flake.graphics.drawPolyStar(0, 0, s, 8, 0.65, -100);
          this.flake.cache(-s, -s, s*2, s*2);
        }

        return this.flake.clone();
      },

      rainDrop: function (s) {
        var drop = new createjs.Shape(),
            m = s/2,
            t = s/3;

        drop.graphics.beginStroke('rgba(0,0,255,0.5)').beginFill('rgba(0,0,255,0.25)');
        drop.graphics.moveTo(0, 0).lineTo(-t, m).quadraticCurveTo(-m, s, 0, s)
                     .moveTo(0,0).lineTo(t, m).quadraticCurveTo(m, s, 0,s);
        this.drop.cache(-s, -s, s*2, s*2);
        return drop;
      }
    }
  };
  //-------------------------
  //
  // END: Utilities
  //
  //-------------------------
  //
  /**
   * DOM Ready to start the page off
   * @return {Void}
   */
  (function () {
    rodeo.Main.getInstance().init();
  })();

}(jQuery, this));