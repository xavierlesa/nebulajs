/* 
 * Nebula JS
 *
 * Primer implementación limpia y seria de nebulajs
 * Copyright 2012, Xavier Lesa
 *
 * Xavier Lesa <xavierlesa@gmail.com>
 *
 * Sun Apr 29 18:39:26 ART 2012
 * 
 */

(function(window, undefined){

    var NebulaJS = {}
    , document = window.document
    , navigator = window.navigator
    , location = window.location;

    
    (function(){
    var queuelist = {};
    var utils = {
        toType : function(obj){ return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase() }

        , range : function(max){ r=[]; for(var n=0; n<=max; n++) r.push(n); return r }

        , keys : function(obj){ return Object.keys(obj) }

        , trim : function(str){ return str.replace(/^\s+|\s+$/g, '') }

        , extend : function(from, ele){ var k,ele = ele || this; for(k in from) ele[k] = from[k]; return ele }

        , args : function(args) { return Array.prototype.slice.call(args, 1) }

        , filterRegExp : function(obj, patt){ 
            var matches={},m,k,ok=utils.keys(obj);
            for(k in ok){ 
                if(m=patt.exec(ok[k])){
                    matches[ok[k]] = { args: m.slice(1), fn: obj[ok[k]] }
                }
            }
            return matches
        }

    }
    , watchHash = function(settings, callback){
        var callback = utils.toType(callback) == 'function' ? callback : utils.toType(settings) == 'function' ? settings : function() {}
        , config = utils.extend(utils.toType(settings) == 'object' ? settings : {}, {
            interval: 100,
            hashstring: "#!/",
            endslash: true,
            debug: false
        })
        , hash = window.location.hash
        , current = ""
        , action = ""
        , def = false
        , queue = {}
        , i;

        // corrige las RegExp
        function regexp_sanitize(regex){
            regex = utils.trim(regex);
            regex = config.endslash && !/\/?\$?$/.test(regex) ? regex+'/' : regex;
            return regex
        }

        // wrapper para el callback
        function wp_callback(hash, action){ return callback(hash, action) }

        // wrapper para action
        function wp_action(fn){
            if(utils.toType(fn) !== 'function'){
                for(var k in fn){ Queue.setQueue(regexp_sanitize(k), fn[k], queue) }
            }
            else Queue.setQueue('default', fn, queue);
        }

        // llama a la cola de fn
        function call_queue(actions, hash, action){
            if(utils.toType(actions) !== 'array') actions = [actions];
            var k,m;
            for(k in Queue.getQueue(queue)){
                for(var i=0; i<actions.length; i++){
                    if(m = (new RegExp(k)).exec(actions[i])){
                        m.slice(1).unshift( actions[i] )
                        Queue.callQueue(k, m, queue)
                    }
                }
            }
        }

        function wh(){
            hash = window.location.hash; // aplica el nuevo hash
            window.location.hash = (hash == "") ? config.hashstring : window.location.hash; // resetea la URL y agrega el hash
            if(hash.length && hash.split(config.hashstring)[1] && current !== hash){ // es un nuevo hash o sea el hash cambió
                action = hash.split(config.hashstring)[1]; // guarda la acción para el mapeo
                current = hash; // guarda el hash actual

                // ejecula la cola de fn para este action, y la global
                call_queue([action, 'default'], hash, action)

                def = false;
                return wp_callback(hash, action); // llama al callback

            } else if(hash.length && current !== hash && !def) {
                // ejecula la cola de fn para este action, y el global
                call_queue(['home', 'default'], hash, action)

                def = true;
                return wp_callback(hash, 'home'); // llama al callback
            }
        }
        
        return {
            action: function(fn){ wp_action(fn); return this },
            start: function(){ i = setInterval(wh, config.interval); return this },
            stop: function(){ clearInterval(i); return this },
            restart: function(){ clearInterval(i); i = setInterval(wh, config.interval); return this }
        }
    }

    var Queue = (function(){
    
        var setQueue = function(names, fn, queue){
            names = njs.utils.toType(names) !== 'array' ? [names] : names;
            queue = njs.utils.toType(queue) == 'object' ? queue : Queue.queuelist;

            for(var name=0; name<=names.length-1; name++) {
                if(!queue[names[name]]) queue[names[name]] = {};
                if(njs.utils.toType(fn) !== 'undefined') {
                    queue[names[name]][fn.name || (Math.random()).toString().replace('0.', names[name]+'-fn-')] = fn;
                }

            }
            return queue[name];
        }

        , getQueue = function(name, queue){ 
            queue = njs.utils.toType(queue) == 'object' ? queue : njs.utils.toType(name) == 'object' ? name : Queue.queuelist;
            name = njs.utils.toType(name) == 'string' ? name : null;
            if(name) return queue[name]; 
            return queue
        }

        , callQueue = function(names, args, queue){
            queue = njs.utils.toType(queue) == 'object' ? queue : njs.utils.toType(args) == 'object' ? args : Queue.queuelist;
            names = njs.utils.toType(names) !== 'array' ? [names] : names;

            for(var name=0; name<=names.length-1; name++) {
                for(var q in queue[names[name]]){ 
                    fn = queue[names[name]][q];
                    fn.apply(this, args);
                }
            }
        };

        return {
            queuelist : {},
            getQueue: getQueue,
            setQueue : setQueue,
            callQueue : callQueue
        }

    })();


    this.utils = utils;
    this.watchHash = watchHash;
    this.Queue = Queue;

    }).apply(NebulaJS);
    
    window.NJS = window.NebulaJS = window.njs = window.nebulajs = NebulaJS;

})(window);



////////////////////////////////////////////////////////////////////////////////
// VER ESTO!!!
////////////////////////////////////////////////////////////////////////////////

var mediator = (function(){
    var subscribe = function(channel, fn){
        if (!mediator.channels[channel]) mediator.channels[channel] = [];
        mediator.channels[channel].push({ context: this, callback: fn });
        return this;
    },
 
    publish = function(channel){
        if (!mediator.channels[channel]) return false;
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, l = mediator.channels[channel].length; i < l; i++) {
            var subscription = mediator.channels[channel][i];
            subscription.callback.apply(subscription.context, args);
        }
        return this;
    };
 
    return {
        channels: {},
        publish: publish,
        subscribe: subscribe,
        installTo: function(obj){
            obj.subscribe = subscribe;
            obj.publish = publish;
        }
    };
 
}());


var ui = (function(){
    var sorter = function(a,b){
        if(a.toLowerCase() < b.toLowerCase()) return -1;
        if(a.toLowerCase() > b.toLowerCase()) return 1;
        return 0;
    }
    , resolveAttr = function(attr){
        var args=[],k;
        for(k in attr){
            args.push( k + "=\"" + (njs.utils.toType(attr[k]) == "object" ? resolveAttr(attr[k]) : attr[k]) + "\"");
        }
        return args.join(" ")
    }
    , createTag = function(tag, value, attr){
        // tag = strong
        // attr = class, id, etc
        // value = Esto es STRONG
        // result = <strong (args...)>value</strong>

        attr = njs.utils.toType(value) == "object" ? value : attr;
        attr = resolveAttr(attr);

        value = njs.utils.toType(value) == "object" ? "" : value || "";

        if(!tag&&!attr) throw "createTag necesita de al menos 2 argumentos";
        var norequired_end = /^img|hr|br|link$/i
        , stag = njs.utils.trim(tag)
        , st = "<"
        , st_end = norequired_end.test(stag) ? "" : ">"
        , et = norequired_end.test(stag) ? "" : "</"
        , et_end = norequired_end.test(stag) ? "/>" : ">"
        , dt = attr ? " " : ""
        , etag = norequired_end.test(stag) ? "" : stag;

        val = norequired_end.test(stag) ? "" : value;

        return [st,stag,dt,attr,st_end,val,et,etag,et_end];

    }
    , list = function(obj, type, sort, reverse){
        type = type || "li";
        sort = sort || false;
        reverse = reverse || false;

        obj = (njs.utils.toType(obj) == "array") ? obj : (njs.utils.toType(obj) == "object") ? njs.utils.keys(obj) : [];
        obj = sort ? obj.sort(sorter) : obj;
        obj = reverse ? obj.reverse() : obj;

        var i,t="";
        for(i=0; i<obj.length; i++){
            t+=createTag(type, obj[i]).join("");
        }
        return t;
    }

    return {
        createTag:createTag
        , list: list 
        , olist: function(obj, sort, reverse){ return list(obj, "li", sort, reverse) }
    }
}());
