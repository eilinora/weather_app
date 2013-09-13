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
      var stage, stageWidth, stageHeight,
          sky,
          condition,
          CANVAS = 'app',
          $canvas = $('#'+CANVAS);



      //adds global listeners used by the site
      var addListeners = function() {
          $(window).on('resize', _.bind( onResize, this) );
        }, //end: addListeners

        setStage = function () {
          stage = new createjs.Stage(CANVAS);
          //
          //seting up framerate for canvas obj
          createjs.Ticker.setFPS(20);
          createjs.Ticker.addEventListener('tick', tick);
        },

        tick = function () {
          stage.update();

          rodeo.views.conditions.updateFallingItems();
        },

        createSky = function () {
          sky = new rodeo.views.Sky();
          sky.createDaytime();
        }

        onResize = function () {
          var ct = $canvas.get(0).getContext('2d');
          $canvas.attr('width', $.$window.width());
          $canvas.attr('height', $.$window.height());
          
          stageWidth = $.$body.width();
          stageHeight = $.$body.height();
          stage.update();

          console.log('resize');
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

            //start the weather...
            this.setupDefaultCondition();

            //init weather app
            rodeo.models.OpenWeatherApi.init();
          },

          setupDefaultCondition: function () {
            rodeo.views.conditions.updateFallingItems();

            createSky();
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
  rodeo.views.Sky = function () {};
  $.extend(rodeo.views.Sky.prototype, {
    current : null,
    next : null,

    setupDisplay: function () {
      this.createDaytime();
    },

    createDaytime: function () {
      var sky = new createjs.Shape(),
          stageWidth = rodeo.Main.getInstance().getStageWidth(),
          stageHeight = rodeo.Main.getInstance().getStageHeight();
      sky.graphics.beginRadialGradientFill(['#ffcc00', '#ffe54c', '#ffff99', '#237acb'], 
                                           [0, 0.1, 0.14, 1],
                                           stageWidth, 0, 0, stageWidth, 0, stageWidth*0.75)
                  .drawRect(0, 0, stageWidth, stageHeight);

      var stage = rodeo.Main.getInstance().getStage();
      stage.addChild(sky);
    },

    createNightTime: function () {

    }
  });

  rodeo.views.BaseAnimatedElement = function () {};
  rodeo.views.BaseAnimatedElement.prototype._super = rodeo.views.BaseAnimatedElement.prototype;
  $.extend(rodeo.views.BaseAnimatedElement.prototype, {
    el: 0,
    speed: 0,
    width: 0,
    maxSize: 0,
    speed: 15,

    create: function () {
      var item = this.draw();
      item.x = Math.random() * rodeo.Main.getInstance().getStageWidth();
      item.y = -20;
      this.setDisplayObject(item);
      return item;
    },

    draw: function () {}, //individual item should be drawn in subclass

    animate: function () {},

    add: function () {
      this.getStage().addChild(this.getDisplayObject());
    },
    remove: function () {
      this.getStage().removeChild(this.getDisplayObject());
    },

    getAniLength: function () {
      return (this.getMaxSize()-this.getWidth())/this.getMaxSize() * this.getSpeed();
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

    setSpeed: function (v) {
      this.speed = v;
    },
    getSpeed: function () {
      return this.speed;
    },

    getStage: function () {
      return rodeo.Main.getInstance().getStage();
    }

  });

  rodeo.views.SnowFlake = function () {
    this.setSpeed(30);
    this.setMaxSize(16);
  };
  rodeo.views.SnowFlake.prototype = new rodeo.views.BaseAnimatedElement();
  $.extend(rodeo.views.SnowFlake.prototype, {
    draw: function () {
      var flake,
          s = Math.random()*this.getMaxSize()+2;
      
      this.setWidth(s);

      flake = new createjs.Shape();
      flake.graphics.beginStroke('white').beginFill('rgba(255,255,255,0.75)');
      flake.graphics.drawPolyStar(0, 0, s, 8, 0.65, -100);
      flake.cache(-s, -s, s*2, s*2);

      return flake;
    },

    animate: function () {
      TweenLite.to(drop, this.getAniLength(), { y : rodeo.Main.getInstance().getStageHeight(), ease: 'linear', onComplete: _.bind(function () {
        this.remove();
      }, this) });
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
  rodeo.views.conditions.BaseCondition.prototype._super = rodeo.views.conditions.BaseCondition.prototype;
  $.extend(rodeo.views.conditions.BaseCondition.prototype, {
    scene: null,
    intensity: 0,
    wind: 0,

    create: function () {},

    update: function () {

    },

    setScene: function (v) {
      this.scene = v;
    },
    getScene: function () {
      return this.scene;
    }
  });

  rodeo.views.conditions.Raining = function () {};
  rodeo.views.conditions.Raining.prototype = new rodeo.views.conditions.BaseCondition();
  $.extend(rodeo.views.conditions.Raining.prototype, {

    makeItRain: function () {

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