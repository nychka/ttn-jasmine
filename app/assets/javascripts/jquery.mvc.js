;(function($) {

  var cache = {};

  $.publish = function(/* String */topic, /* Array? */args){
    try{
      cache[topic] && $.each(cache[topic], function(){
        this.apply($, args || []);
      });
    } catch (err) {
      // handle this error
      console.log(err);
    }
  };

  $.subscribe = function(/* String */topic, /* Function */callback){
    if(!cache[topic]){
      cache[topic] = [];
    }
    cache[topic].push(callback);
    return [topic, callback]; // Array
  };

  $.unsubscribe = function(/* Array */handle){
    var t = handle[0];
    cache[t] && $.each(cache[t], function(idx){
      if(this == handle[1]){
        cache[t].splice(idx, 1);
      }
    });
  };

  $.Controller = (function() {
    function Controller(name, obj, subs, ancestorClass) {

      var defaultEvents = "change click contextmenu dblclick keydown keyup keypress mousedown mousemove mouseout mouseover mouseup reset resize scroll select submit focus blur focusin focusout mouseenter mouseleave draginit dragstart drag dragend shown ifChecked ifUnchecked".split(" ");
      var customEventReg = /(.+) \-\> (\w+)/i;
      var self = this;
      var pluginname = "attach"+name;
      var ancestor = false;
      var inst;

      this.events = [];
      this.actions = [];
      this.definitionObj = obj;
      this.subscriptions = subs;
      this.controllerName = name;
      this.ancestorClass = ancestorClass;


      if((this.ancestorClass != '') && window[this.ancestorClass]){
        ancestor = window[this.ancestorClass];
      }

      if(ancestor) {
        this.definitionObj = $.extend({}, ancestor.definitionObj, this.definitionObj);
        this.subscriptions = $.extend({}, ancestor.subscriptions, this.subscriptions);
      }

      $.each(this.definitionObj, function(key, def){
        if(typeof(def) == 'function') {
          if(($.inArray(key, defaultEvents) > -1) || key.match(/^ajax:/)) { // event for main element
            self.events.push([key, def]);
          } else if((matches = key.match(customEventReg)) && ($.inArray(matches[2], defaultEvents) > -1)) { // event for sub-element
            self.events.push([matches[1], matches[2], def]);
          } else { // action
            self.actions.push([key, def]);
          }
        } else { // class property
          self[key] = def;
        }
      });

      function ControllerInstance(elem, options) {

        this.element = $(elem);
        this.options = options;
        this.events = [];
        this.subscriptions = [];

        var self = this;

        $.each(this.parent.actions, function() {
          self[this[0]] = $.proxy(this[1], self);
        });

        $.each(this.parent.events, function() {
          var inst_ev = this.slice(), binder = '', last = (inst_ev.length - 1);
          inst_ev[last] = $.proxy(this[last], self);
          self.events.push(inst_ev);
          if(this.length == 2) {
            //self[this[0]] = this[1];
            binder = 'bind';
          } else if(this.length == 3){
            binder = 'delegate';
          }
          self.element[binder].apply(self.element, inst_ev);
        });

        $.each(this.parent.subscriptions, function(ch, h) {
          self.subscriptions.push($.subscribe(ch, $.proxy(h, self)));
        });

        this.super_call = function(meth_name, args) {
          if(!this.ancestor) {
            alert('Controller has no ancestor');
            return;
          }

          var sub_event = false, ancestor = this.ancestor, i = 0, not_found = true, all_methods = [];

          if(matches = meth_name.match(customEventReg)) {
            sub_event = true;
            meth_name = [matches[1], matches[2]];
          }

          all_methods = ancestor.actions.concat(ancestor.events).concat($.map(ancestor.subscriptions, function(val, key){ return [[key, val]] }));

          while((i < all_methods.length) && not_found) {
            meth = all_methods[i];
            if((!sub_event && (meth[0] == meth_name)) || (sub_event && ((meth[0] == meth_name[0]) && (meth[1] == meth_name[1])))) {
              meth[meth.length - 1].apply(this, (typeof args == 'undefined' ? [] : args) );
              not_found = false;
            }
            i += 1;
          }

          if(not_found) {
            throw("Method not found "+meth_name);
          }
        }

        this.destroy = function() {
          $.each(this.events, function(){
            self.element[(this.length == 2) ? 'unbind' : 'undelegate'].apply(self.element, this)
          });

          $.each(this.subscriptions, function() {
            $.unsubscribe(this);
          });

          $.publish(this.parent.controllerName+"/destroyed", [this.element]);

          this.element = null;
          this.options = null;
          this.events = null;
          this.subscriptions = null;
        };

      }
      ControllerInstance.prototype.parent = this;
      ControllerInstance.prototype.ancestor = ancestor;

      this.instantiate = function(elem, options){
        inst = new ControllerInstance(elem, options);
        if(inst['init'] && (typeof(inst['init']) == 'function')) inst.init();
        return inst;
      }

      if (!$.fn[pluginname] ) {
        $.fn[pluginname] = function() {
          var args = arguments, ctrls;
          return this.each(function(){
            ctrls = $(this).data('controllers') || [];
            ctrls.push(self.instantiate(this, args[0] || {}));
            $(this).data('controllers', ctrls);
          });
        }
      }

      $.fn.extend({
        controllers: function() {
          var instances = [];
          this.each(function(){
            $.merge(instances, $(this).data('controllers') || []);
          });
          return instances;
        },
        controller: function() {
          return this.controllers.apply(this, arguments)[0];
        }
      });

    }
    return function (name, obj, subs) {
      ancestor_name = ''
      if(typeof(arguments[1]) == 'string') {
        ancestor_name = arguments[1]
        obj = arguments[2]
        subs = arguments[3]
      }
      return(window[name] = new Controller(name, obj || {}, subs || {}, ancestor_name));
    }
  })();

})(jQuery);
