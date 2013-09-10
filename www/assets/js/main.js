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
  rodeo.ApplicationController  = (function () {
    /**
     * Stores instance of our AppController
     */
    var instance;

    /**
     * Stores all private methods to the AppRouter so that no other
     * @return {Object} Returns any public methods being exposed
     */
    var initialize = function () {
      //adds global listeners used by the site
      var addListeners = function() {
          var that = this;
          $(window).on('resize', _.debounce( function( e ) {
            //do something
          }, 125 ) );
        }, //end: addListeners

        getUserLocation = function () {
          rodeo.models.LocationServices.requestLocation().done ( function (data) {
            console.log (data);
          });
        },

        getStage = function () {
          this.stage = new createjs.Stage('app');
          console.log(this.stage);
          return this.stage;
        },

        on_resize = function () {
          //do something
        }; //end: on_resize

        /**
         * Returns any public facing functions for this class
         */
        return {
          
          init: function () {
            //add app listeners
            addListeners();
            rodeo.models.OpenWeatherApi.init();
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

  //-------------------------
  //
  // BEGIN: Views
  //
  //-------------------------
  rodeo.views = {};
  rodeo.views.Condition = function () {

  };
  $.extend (rodeo.views.Condition.prototype, {

  });

  /*rodeo.views.Main = function () {
    
  };
  $.extend (rodeo.views.Main.prototype, {
    stage : null,
    
    setupDisplay: function () {
      this.stage = new createjs.Stage('app');
      console.log(this.stage);
    }
  });
*/

  //-------------------------
  //
  // END: Views
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
    rodeo.ApplicationController.getInstance().init();
  })();

}(jQuery, this));