/**
 * aronaTravelApp.js
 * Initializes Arona.travel app in Angular.js
 *
 * Author: Manlio Joaquín García González (manliojoaquin@gmail.com)
 *
 * This file contains the initializator, values and methods for the app.
 * Provides behaviour to set localization based on url location, build
 * navigation trees and import panels and subpanels as required.
 *
 * Once loaded, you may use these variables and methods in your Angular app:
 *
 * - {{ translate( string, [prefix] ) }}
 *
 *   Fetch a localized alternative from the internal dictionary, or the string
 *   if none is found.
 *
 * - {{ page }}
 *
 *   Returns the internal page object, with variables like title or dictionary
 *   The page object act as a global scope variables holder.
 *
 * - {{ lang() }}
 *
 *   Returns the current language based on the url location as a string
 *
 * - {{ path() }}
 *
 *   Returns the current angular path location as a string
 *
 * - {{ sections() }}
 *
 *   Returns the current angular path location as an array
 *
 * - {{ current_section([String section]) }}
 *
 *   Returns the current section, or a boolean if a string is provided, true if matching
 *   the current section.
 *
 * - {{ level() }}
 *
 *   Returns the current angular path level of nesting as an integer
 *
 * - {{ nav }}
 *
 *   Returns a hash object with keys of navigation links. They can also have more content.
 *   E.G: {{ nav }} => {"AngularJS": {"href":"http://angularjs.org", "content":[...]}}
 *
 * - {{ sublinks( [String link] ) }}
 *
 *   Returns a hash with the last "content" value of the "link" var (current path by default),
 *   as seen in the nav object. Generally the child nodes, or the sibling nodes if the current
 *   node has no "content" value.
 *
 * - {{ breadcrumbs }}
 *
 *   Returns an object with arrays of navigation links based on current location.
 *   E.G: {{ breadcrumbs }} => [{"label":"home", "href":"#/"},{"label":"angular", "href":"#/angular"}]
 */

var app = angular.module("aronaTravelApp", ["ngRoute","ngResource","mm.foundation"]);

app.value('page', {
    'title': "Arona.travel",
    'dictionary':{},
    'panels':{}
});

app.service('language', ["$location", "$window", function($location, $window){

    this.current = function() { return $location.path().split('/')[1]; }


    this.available_languages = ['de', 'en', 'es', 'fi', 'fr', 'it', 'nl', 'ru', 'sv'];

    this.isValid = function(l){
        return this.available_languages.includes(l) ? true : false ;
    };

    this.window_lang = $window.navigator.language;

    this.default = this.isValid(this.window_lang.split('-')[0]) ? this.window_lang.split('-')[0] : 'en';

}]);

function ResourcePaginator(language, $resource){

    var self = this;
    var scope_interface = [];

    this.variables = {
        'elements': [],
        'stats': {
            'size': 0,
            'largest_size': 0
        },
        // parameterized URL template with parameters prefixed by : as in /user/:username
        'url': 'api/fetch.json',
        // default values for url parameters
        'parameters': {},
        // hash with declaration of custom actions
        'actions': {
            "get": {
                "method": "POST",
                "isArray": true
            }
        },
        // hash with custom settings
        'settings': {}
    };

    // hash as seen by the final cgi
    this.values = {
        language: language.current(),
        offset: 0,
        limit: 0,
        filters: {},
        values: [],
        collection: null,
        stats: true
    };

    this.resource = $resource( self.variables.url, self.variables.parameters, self.variables.actions, self.variables.settings );

    function get(){
        self.resource.get( self.values, function(data){
            if (self.values.collection != null) {
                if (data[0] == null){
                    console.warn("Got a null array. Probably no such collection: " + self.values.collection);
                } else {
                    if (true == self.values.stats){
                        var stats = data.pop();
                        self.size(stats.size);
                        self.last_modified(stats.last_modified);
                    }
                    if (data.length > 0){
                        var last_item = data[data.length - 1];
                        while ( last_item.hasOwnProperty("error")){
                            var error_object = data.pop();
                            console.warn("API responded with the following error: " + error_object.error);
                            console.warn("Offending parameters:");
                            console.warn(error_object.parameters);
                            if (data.length > 0) last_item = data[data.length - 1];
                            else last_item = {};
                        }
                    }
                    self.elements(data);
                }
            }
        });
    }

    this.elements = function(e){
        if (e != undefined){
            self.variables.elements = e;
        }
        return self.variables.elements;
    };
    scope_interface.push("elements");

    this.size = function(s){
        if (s != undefined){
            if (s >= 0){
                self.variables.stats.size = s;
                if (s > self.variables.stats.largest_size) self.largest_size(s);
            }
        }
        return self.variables.stats.size;
    };
    scope_interface.push("size");

    this.largest_size = function(s){
        if (s != undefined){
            if (s >= 0) self.variables.stats.largest_size = s;
        }
        return self.variables.stats.largest_size;
    };
    scope_interface.push("largest_size");

    this.last_modified = function(d){
        if (d != undefined){
            self.variables.last_modified = d;
        }
        return self.variables.stats.last_modified;
    };
    scope_interface.push("last_modified");

    this.pages = function(){
        var output = [];
        var pages = Math.ceil(self.size() / self.page_size());
        for (var i = 0; i < pages; i++){
            var item = {'number': (i + 1), 'href': (i + 1)};
            if ( item.number == self.page() ) item.current = true;
            output.push(item);
        }
        return output;
    };
    scope_interface.push("pages");

    this.page = function(p){
        if (p != undefined){
            var target = ( (p - 1) * self.page_size() );
            var max = ( Math.ceil(self.size() / self.page_size()) * self.page_size() );
            if (target >= 0 && target <= max) self.set_values({offset: target});
        }
        return Math.ceil(self.values.offset / self.page_size()) + 1;
    };
    scope_interface.push("page");

    this.page_size = function(p){
        if (p != undefined){
            if (p > 0){
                self.set_values({limit: p});
            }
        }
        return self.values.limit;
    };
    scope_interface.push("page_size");

    this.previous_page = function(){
        var target =  self.values.offset - self.page_size();
        if ( target >= 0 ) self.set_values({offset: target});
    };
    scope_interface.push("previous_page");

    this.next_page = function(){
        var max = ( ( Math.ceil(self.size() / self.page_size() ) - 1 ) * self.page_size() );
        var target = self.values.offset + self.page_size();
        if ( target <= max ) self.set_values({offset: target});
    };
    scope_interface.push("next_page");

    this.filter = function(f, v){
        if (f === undefined) return null;
        if (v !== undefined){
            if (!angular.equals(self.values.filters[f], v)){
                var o = {};
                o[f] = v;
                self.set_values({"filters": o});
            }
        }
        if (self.values.filters[f] === undefined){
            return null;
        } else {
            return self.values.filters[f];
        }
    };
    scope_interface.push("filter");

    this.filters = function(o){
        if (o !== undefined) self.set_values({ "filters": o });
        return self.values.filters;
    };
    scope_interface.push("filters");

    this.toggle_filter = function(f, v){
        if (f === undefined) return null;
        if (v !== undefined){
            var o = {};
            o[f] = (angular.equals(self.values.filters[f], v)) ? null : v;
            self.set_values({"filters": o});
        }
        if (self.values.filters[f] === undefined){
            return null;
        } else {
            return self.values.filters[f];
        }
    };
    scope_interface.push("toggle_filter");

    this.set_values = function( new_values ){
        var values_changed = false;
        for (var k in new_values){
            if (new_values.hasOwnProperty(k)) {
                if (!angular.equals(self.values[k], new_values[k])){
                    values_changed = true;
                    // if it's a non-null object...
                    if (self.values[k] !== null && typeof self.values[k] === 'object'){
                        var values = new_values[k];
                        // ...for every value in it...
                        for ( var value in values) if (values.hasOwnProperty(value)) {
                            // if it's not null, update it
                            if (values[value] != null) self.values[k][value] = values[value];
                            // else, remove it
                            else delete self.values[k][value];
                        }

                    } else {
                        // if it's not an object, replace it
                        self.values[k] = new_values[k];
                    }
                }
            }
        }
        if (values_changed) get();
    };

    this.expose_interface = function(scope){
        for ( var i = 0; i < scope_interface.length; i++ ){
            scope[scope_interface[i]] = self[scope_interface[i]];
        }
    }

}

app.config(function($routeProvider) {
    var isValidLang = function($location, language){
        var current_lang = $location.path().split('/')[1];
        if ( ! language.isValid(current_lang) ) $location.path('/' + language.default );
    };

    $routeProvider
    .when("/:language", {
        templateUrl : "assets/panels/main.htm",
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("/:language/galeria", {
        redirectTo: "/:language/galeria/tour_virtual_360"
    })
    .when("/:language/planea_tu_viaje/donde_alojarse", {
        redirectTo: "/:language/planea_tu_viaje/donde_alojarse/hoteles"
    })
    .when("/:language/404", {
        templateUrl : "assets/404.htm",
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("/:language/planea_tu_viaje/donde_alojarse/:type/:territorial", {
        templateUrl : '/assets/panels/planea_tu_viaje/donde_alojarse/view.htm',
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("/:language/actividades/:activity", {
        templateUrl : '/assets/panels/actividades/view.htm',
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("/:language/eventos/:event", {
        templateUrl : '/assets/panels/eventos/view.htm',
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("/:language/:panel*", {
        templateUrl : function(urlattr){
            return '/assets/panels/' + urlattr.panel + '.htm';
        },
        resolve:{ "check":isValidLang },
        controller: "aronaTravelCtrl"
    })
    .when("", {
        redirectTo: function(language){ return "/" + language.default; }
    })
    .otherwise({
        resolve:{ "check":isValidLang },
        redirectTo: function(urlattr){
            return '/' + urlattr.language + '/404';
        }
    });
});

app.service('hotels', ["language", "$resource", ResourcePaginator]);
app.controller("hotelsCtrl", function($rootScope, $scope, hotels) {

    hotels.expose_interface($scope);

    hotels.set_values({
        "collection": "territoriales",
        "filters": {"SUBTIPO": "Hoteles"},
        "values": ["MAPA", "ACCESOS", "CATEGORIA", "CIERRE", "CODCONTENIDO", "CODLOCALIDAD", "DATOS_INTERES", "DESCRIPCION", "DESCRIPCION_COMUN", "DOCUMENTO", "EMAIL", "FAX", "F_BAJA", "F_FIN_NOV", "F_FIN_PUB", "F_INICIO_NOV", "F_INICIO_PUB", "F_REVISION", "HORARIO", "IMAGEN", "TITULO", "NOMBRE_SOCIAL", "NOVEDAD", "PALABRAS_CLAVE", "PUBLICADO", "SERV_PRINCIPALES", "SUBTIPO", "TELEFONO", "TITULO", "VACACIONES", "WEB_PROPIA", "ZONA", "DIRECCION"],
        "offset": 0,
        "limit": 4
    });
});

app.controller("aronaTravelCtrl", function($rootScope, $location, $routeParams, $resource, page, language ) {

    $rootScope.page = page;

    $rootScope.lang = function (){ return language.current(); };

    $rootScope.available_languages = function (){ return language.available_languages; };

    $rootScope.params = $routeParams;

    $rootScope.location = $location;


    var Lang = $resource(

            // Url targeting the resource
            '/locales/:language.json',

            // Default values for url parameters. These can be overridden in actions methods.
            // If a parameter value is a function, it will be called every time a param value
            // needs to be obtained for a request (unless the param was overridden).
            // The function will be passed the current data value as an argument.
            //
            //  Given a template /path/:verb and parameter {verb:'greet', salutation:'Hello'}
            //  results in URL /path/greet?salutation=Hello.
            //
            //  If the parameter value is prefixed with @, then the value for that parameter
            //  will be extracted from the corresponding property on the data object (provided
            // when calling a "non-GET" action method). For example, if the defaultParam object is
            // {someParam: '@someProp'} then the value of someParam will be data.someProp. Note
            // that the parameter will be ignored, when calling a "GET" action method (i.e. an
            // action method that does not accept a request body)
            {
                language: $rootScope.lang() == undefined? 'en' : $rootScope.lang()
            }
    );
    Lang.get(function(data){
        for (var k in data){
            if (data.hasOwnProperty(k)) {
                page.dictionary[k] = data[k];
            }
        }
    });

    $rootScope.path = function (){ return $location.path(); };
    $rootScope.level = function (){ return $location.path().substring(1).split('/').length; };
    $rootScope.sections = function (){ return $location.path().substring(1).split('/'); };
    $rootScope.current_section = function (section){
        var sections = $rootScope.sections();
        if (section == undefined) return sections[sections.length - 1];
        else return ( section == sections[sections.length - 1] );
    };
    $rootScope.breadcrumbs = function() {
        var output = [];
        var path = $location.path().substr(1).split('/');
        var path_length = path.length;
        for (var i = 0; i < path_length; i++){
            var item = path[path.length - 1];
            item = {'label': item, 'href': '#/' + path.join('/')};
            if (i == 0) item.current = true;
            if (i == (path_length - 1) ) item.label = "inicio";
            output.push(item);
            path.pop();
        }
        output.reverse();
        return output;
    };

    $rootScope.nav = {};
    $resource('/api/fetch_navigation.json', {language:$rootScope.lang()}).get(function(data){
        $rootScope.nav = data;
    });
    $rootScope.sublinks = function(link){
        var sections = link == undefined ? $rootScope.sections() : '/' + $rootScope.lang() + link.substring(1).split('/');
        var sublinks = $rootScope.nav;
        for ( var i = 1; i < (sections.length + 1); i++){
            if ( sublinks.hasOwnProperty(sections[i]) ){
                if ( sublinks[sections[i]].hasOwnProperty('content') ){
                    sublinks = sublinks[sections[i]].content;
                } else break;
            } else break;
        }
        return sublinks;
    };

    $rootScope.translate = function(stringA, stringB ) {
        // this is to respect the less surprise directive. Prefixes should precede the target string
        var string = stringB == undefined ? stringA : stringB;
        var prefix = stringB == undefined ? null : stringA;

        if ( page.dictionary.hasOwnProperty( prefix == null? string : prefix + string ) ){
            string = page.dictionary[prefix == null ? string : prefix + string];
        }
        return string;
    };

    $rootScope.string_interpolate = function() {
        var args = Array.from(arguments);
        var string = args[0];

        for (var i = 0; i < args.length; i++){
            if ( args[i] != undefined) string = string.replace('{'+(i - 1)+'}', args[i]);
        }

        return string;
    };

    page.panels["home"] = {
        'url': '/api/fetch.json',
        'offset': 0,
        'limit': 3,
        'filters': {},
        'values': ['TITULO', 'F_INICIO_PUB', 'CODCONTENIDO', 'IMAGEN'],
        'elements': {}
    };

    var News = $resource(
            // parameterized URL template with parameters prefixed by : as in /user/:username
            page.panels["home"].url,
            // default values for url parameters
            {},
            // hash with declaration of custom actions
            {
                "get": {
                    "method": "POST",
                    "isArray": true
                }
            },
            // hash with custom settings
            {}
    );
    News.get(
        {
            language: $rootScope.lang() == undefined? 'en' : $rootScope.lang(),
            offset: page.panels["home"].offset,
            limit: page.panels["home"].limit,
            filters: page.panels["home"].filters,
            values: page.panels["home"].values,
            collection: "actividades"
        }, function(data){
        page.panels["home"].elements = data;
    });

    var Territorial = $resource(
            '/api/fetch.json',
            {},
            {
                "get": { "method": "POST", "isArray": true }
            }
    );
    Territorial.get({
        language: $rootScope.lang() == undefined? 'en' : $rootScope.lang(),
        limit: 1,
        filters: {"CODCONTENIDO": $routeParams.territorial},
        /*CODCONTENIDO│CODIDIOMA│CODSUBTIPOCONT│SUBTIPO│CODCATEGORIA│CATEGORIA│IMAGEN│WEB_PROPIA│DOCUMENTO│CODZONA│ZONA│F_INICIO_PUB│F_FIN_PUB│F_REVISION│F_BAJA│NOVEDAD│F_INICIO_NOV│F_FIN_NOV│CODPROPIETARIO│NOMBRE│TITULO│DESCRIPCION_COMUN│DATOS_INTERES│PALABRAS_CLAVE│CODLOCALIDAD│DESCRIPCION│TIPO_VIA│NOMBRE_VIA│NUMERO│BLOQUE│PORTAL│ESCALERA│PLANTA│PUERTA│LOCAL│CODIGO_POSTAL│TELEFONO│FAX│EMAIL│NOMBRE_SOCIAL│VACACIONES│CIERRE│HORARIO│ACCESOS│SERV_PRINCIPALES│PUBLICADO│REF_VPORTAL*/
        values: ["MAPA_IFRAME", "MAPA","CODCONTENIDO","TITULO","ZONA","TELEFONO","FAX","WEB_PROPIA","DIRECCION","EMAIL","SERV_PRINCIPALES", "IMAGEN"],
        collection: "territoriales"
    }, function(data){
        page.panels["territorial"] = data[0];
    });

    $rootScope.randomInt = function(i){
        return Math.floor(Math.random() * i) + 1;
    };

});
app.filter("trust", ['$sce', function($sce) {
      return function(htmlCode){
              return $sce.trustAsHtml(htmlCode);
                }
}]);
app.filter("pad", [function() {
    return function(n, width, z){
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    };
}]);
