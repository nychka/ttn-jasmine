function PaymentCard(settings){

    this.default_settings = {
        card_wrapper:               '.card_data',
        card_input_wrapper:         '.card-num-wrapper',
        first_input:                '#card_number_0',
        card_number_0:              '#card_number_0',
        card_number_1:              '#card_number_1',
        card_number_2:              '#card_number_2',
        card_number_3:              '#card_number_3',
        card_number_4:              '#card_number_4',
        card_date_month:            '#card_date_month',
        card_date_year:             '#card_date_year',
        card_holder:                '#card_holder',
        card_cvv:                   '#card_cvv',
        card_holder_wrapper:        '.card_owner',
        card_cvv_wrapper:           '.card_cvv',
        card_holder_not_required:   '#card_holder_not_required',
        if_you_have_cvv:            '#if_you_have_cvv'
    };
    this.settings = $.extend({}, this.default_settings, settings);
    this.card_types = [];
    this.states = {
        'default': new DefaultState()
    };
    this.default = {
        cvv_description: null
    };
    this.currentCardType = null;

    this.addCardType = function(card_type)
    {
        var cardType = new CardType(card_type);
      this.card_types.push(cardType);
      this.defineAvailableStates();
    };

    this.getNumberInputs = function(){
        var wrapper = this.getWrapper();
        var numbers = wrapper.find(this.settings.card_input_wrapper + ' input');
        return numbers;
    };
    this.getActiveNumberInputs = function(){
      return $(this.settings.card_input_wrapper + ' input:visible');
    };
    this.getCount = function(){
        var count = 0;
        var numbers = this.getActiveNumberInputs();

        numbers.each(function(i, number){
            count += number.value.length;
        });

        return count;
    };
    this.bindListeners = function(){
        var self = this;
        var numbers = $(this.settings.card_input_wrapper + ' input');

        numbers.each(function(i, number){
          $(number).on('keyup', function(e){ self.operate(e); });
        });
    };
    this.getForm = function(){
      var form = $('form:first');

      if(window.time_to_debug){
          var serializedArray = form.serializeArrray();
          console.table(serializedArray);
      }

      return form;
    };
    this.getFirstInput = function(){
        return $(this.settings.card_input_wrapper + ' ' + this.settings.first_input);
    };
    //FIXME: включення через кукі доробити
    this.debug = function(message)
    {
      if(window.time_to_debug){
        console.log(message);
      }
    };
    this.operate = function(e){
      var current_state = this.getCurrentState();
      var count = this.getCount();
      this.debug('count: ' + count + ' state: ' + current_state.name);
      try{
        var numbers = ''; this.getActiveNumberInputs().map(function(i, input){ return numbers += $(input).val(); }); 
        this.passLuhnAlgorythm(numbers);
      }catch(e){ this.debug(e.message); }
      

      if(count == 18 && current_state.name == 'momentum_activated'){
        this.transitToState('momentum_filled');
        this.debug('count: ' + count + ' state: ' + current_state.name + ' next: momentum_filled');
      }
      if(count < 18 && current_state.name == 'momentum_filled'){
        this.transitToState('momentum_activated');
        this.debug('count: ' + count + ' state: ' + current_state.name + ' next: momentum_activated');
      }
    };
    this.getCardTypeByFirstDigits = function(combination)
    {
        if(typeof combination !== 'number' && typeof combination !== 'string') {
            throw Error('Combination must consist from two digits!');
        }
        if(typeof combination === 'string' && combination.length >= 2 && parseInt(combination)){
            combination = parseInt(combination.substr(0,2));
        }
        var result = this.card_types.filter(function(item) { return item.numbers.indexOf(combination) >= 0; });

        if(result.length > 1) { throw Error('More than one card type was found by combination:  ' + combination); }
        if(result.length == 1 && ! result[0].isActive()) {
            try {
                throw Error('Card type ' + result[0].card_type + ' is disabled for the moment!');
            }catch(e){
                return false;
            }
        }

        return result.length ? result[0] : false;
    };
    this.defineState = function(card_setting)
    {
        if(card_setting.hasOwnProperty('card_type')){
            var state = card_setting.card_type + '_activated';

            if(this.states.hasOwnProperty(state)){
                return state;
            }
        }

        return 'default';
    };
    this.transit = function(combination){
        var cardType = this.getCardTypeByFirstDigits(combination);
        var state = this.defineState(cardType);

        this.transitToState(state);
        this.setCurrentCardType(cardType);
    };
    this.bindFirstInputListener = function(){
        var self = this;
        var firstInput = $(this.settings.card_input_wrapper + ' ' + this.settings.first_input);
        
        firstInput.on('keyup', function(e){ self.transit(e.target.value); });
    };
    this.addValidationRule = function(rule){
        this.getFirstInput()
            .addClass(rule)
            .removeClass('valid_card_number_visa_master');

        this.setValidationRule(rule);
    };
    this.setValidationRule = function(rule)
    {
        this.settings.validation_rule = rule;
    };
    this.removeValidationRule = function(){
      if(!this.getFirstInput().hasClass(this.settings.validation_rule)) { return false; }
        this.getFirstInput()
            .removeClass(this.settings.validation_rule)
            .addClass('valid_card_number')
            .addClass('valid_card_number_visa_master');
    };
    this.prepareValidationRule = function(rule){
      var self = this;

      if(typeof $.validator.methods[rule] !== 'function'){
        $.validator.addMethod(rule, function(value, element){
          var first_n = $(element).parents('.card_num').find('input:first').val().substr(0, 2);

          var matches = self.getCardTypeByFirstDigits(first_n);
          if(!matches){
              $(element).parent().addClass('error');
          }

          return matches;
        }, "Please enter a valid card number. Maestro MOMENTUM");
      }  
    };
    this.passLuhnAlgorythm = function(numbers)
    {
        var sum = 0;
        var length = 0;
        numbers = numbers.replace(/\s/g, '');
        for (var i = 0; i < numbers.length; i++) {
            var intVal = parseInt(numbers.substr(i, 1));
            if (i % 2 == 0) {
                intVal *= 2;
                if (intVal > 9) {intVal = 1 + (intVal % 10);}
            }
            sum += intVal;
        }
        this.debug('sum: '+ sum+ ' length: '+ numbers.length+' valid: '+ (sum % 10 == 0));
        return (sum % 10 == 0);
    };
    this.getCardBlocks = function()
    {
        var blocks = $(this.settings.card_wrapper);
        if(!(blocks && blocks.length)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('card_blocks')) this.card_blocks = blocks;
        
        return this.card_blocks;
    };
    this.getWrapper = function()
    {
        var block = $(this.settings.card_wrapper);
        if(!(block)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('active_wrapper')) this.active_wrapper = block;

        return this.active_wrapper;
    };
    this.getContext = function()
    {
        var wrapper = this.getWrapper();
        var context = {
            'self':             this,
            'wrapper':          wrapper,
            'card_number_0':    wrapper.find(this.settings.card_number_0),
            'card_number_1':    wrapper.find(this.settings.card_number_1),
            'card_number_2':    wrapper.find(this.settings.card_number_2),
            'card_number_3':    wrapper.find(this.settings.card_number_3),
            'card_number_4':    wrapper.find(this.settings.card_number_4),
            'card_date_month':  wrapper.find(this.settings.card_date_month),
            'card_date_year':   wrapper.find(this.settings.card_date_year),
            'card_holder':      wrapper.find(this.settings.card_holder),
            'card_cvv':         wrapper.find(this.settings.card_cvv)
        };
        return context;
    };
    this.getCurrentState = function()
    {
        if(!this.hasOwnProperty('current_state')){
            var states = this.getAllStates();
            this.current_state = states['default'];
        }
       
        return this.current_state;
    };
    this.getAllStates = function()
    {
        return this.states;
    };
    this.getCardTypes = function(active)
    {
        var isActive = active == undefined ? true : active;

        return this.card_types.filter(function(cardType){
            return cardType.isActive() == isActive
        });
    };
    this.defineAvailableStates = function()
    {
        var card_types = this.getCardTypes();
        var states = {};

        card_types.forEach(function(card_type){
            if(card_type && card_type.hasOwnProperty('states')){
                card_type.states.forEach(function(state){
                    var obj = new state();
                    states[obj.name] = obj;
                });
            }
        });

        $.extend(this.states, states);
    };
    this.getState = function(state)
    {   
        var states = this.getAllStates();
        if(!states[state]) throw('State ' + state + ' not found!');

        return states[state];
    };
    this.transitToState = function(state)
    {
      this.debug('transit from: ' + this.getCurrentState()['name'] + ' to: ' + state);
      var state = this.getState(state);
      var context = this.getContext();
      state.handle(context);
      this.current_state = state;
    };
    this.bindLinkIfYouHaveCvv = function(){
      var self = this,
          wrapper = this.getWrapper();

      wrapper.find(this.settings['if_you_have_cvv']).on('click', function(e){
        e.preventDefault();
        self.transitToState('momentum_activated');
      });
    };
    this.initializeDefaultCardTypes = function()
    {
        this.addCardType({
            card_type: 'visa',
            numbers: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
            states: [DefaultState]
        });
        this.addCardType({
            card_type: 'mastercard',
            numbers: [51, 52, 53, 54, 55],
            states: [DefaultState]
        });
    };
    this.init = function(){
        this.transitToState('default');
        this.bindListeners();
        this.bindFirstInputListener();
        this.initializeDefaultCardTypes();
        this.setHub(new Hub());
    };
    this.hasDefaultValue = function(key)
    {
        return this.default.hasOwnProperty(key) && this.default[key] !== null;
    };
    this.setDefaultValue = function(key, value)
    {
        if(this.default.hasOwnProperty(key) && this.default.key == null){
            this.default[key] = value;
        }else{
            console.warn('You are trying to change default value from: ' + this.default.key + ' to: ' + value);
        }
    };
    this.getDefaultValue = function(key)
    {
        return this.default[key];
    };
    this.getCurrentCardType = function()
    {
        return this.currentCardType;
    };
    this.reset = function()
    {
        var form = this.getForm();
        form[0].reset();
        this.transitToState('default');
        this.setCurrentCardType(false);
    };
    this.setCurrentCardType = function(type)
    {
        var card_type = typeof type === 'object' ? type.card_type : false;
        var message = 'card type changed ';
        message += this.currentCardType ? 'from ' + this.currentCardType.card_type : '';
        message += 'to ' + card_type;

        var envelope = {
            event: 'card_type_changed',
            message: message,
            data: { card_type: card_type }
        };

        this.getHub().publish(envelope.event, envelope);
        this.currentCardType = type;
    };
    this.getHub = function()
    {
        return this.hub;
    };
    this.setHub = function(hub)
    {
        this.hub = hub;
    };
    this.getCardTypeById = function(id)
    {
      var result = this.card_types.filter(function(cardType){ return cardType.card_type === id; });
      if(result.length !== 1) throw Error('card type by id: ' + id + ' not found!');

      return result[0];
    };
};
function CardType(obj)
{
    this.card_type = obj.card_type;
    this.numbers = obj.numbers;
    this.states = obj.states;
    this.active = true;

    this.disable = function()
    {
      this.active = false;
    };
    this.enable = function()
    {
        this.active = true;
    };
    this.isActive = function()
    {
        return this.active;
    };
};
function Hub()
{
    var events = {};

    this.getEvents = function()
    {
      return events;
    };
    this.delayPublishing = function(event, data)
    {
      events[event]['publishing'] = data;
    };
    this.getDelayedPublishing = function(event)
    {
      return events[event].hasOwnProperty('publishing') && events[event]['publishing'];
    };
    this.checkEvent = function(event)
    {
        if(! events.hasOwnProperty(event)){
            events[event] = { callbacks: [] };
        }
    };
    this.subscribe = function(event, callback, context)
    {
        this.checkEvent(event);
        if(events[event].callbacks.indexOf(callback) === -1){
            if(typeof context === 'object') {
               callback = callback.bind(context);
            }
            var delayedPublishing = this.getDelayedPublishing(event);

            if(delayedPublishing) { callback.call(this, delayedPublishing); }

            events[event].callbacks.push(callback);
        }
    };
    this.publish = function(event, data)
    {
        this.checkEvent(event);
        this.delayPublishing(event, data);

        events[event].callbacks.forEach(function(callback){
           callback.call(this, data);
        });
    };
};

function DefaultState()
{
    this.name = 'default';

    this.handle = function(context)
    {
        var card = context.self;
        card.removeValidationRule();
        context.card_number_4.prop('disabled', true).val('').hide();
        context.card_holder.prop('required', true);
        context.card_cvv.val('');
        context.wrapper.find(card.settings['card_holder_wrapper']).show();
        context.wrapper.find(card.settings['card_cvv_wrapper']).show();
        context.wrapper.find(card.settings['if_you_have_cvv']).hide();
        context.wrapper.find(card.settings['card_holder_not_required']).hide();

        this.restore_cvv_description(context);
        context.card_number_3.prop('maxlength', 4).attr('maxlength', 4);
        context.card_number_3.prop('data-length', 4).attr('data-length', 4);
        context.card_number_3.prop('placeholder', 'XXXX').attr('placeholder', 'XXXX');

        context.card_cvv.prop('maxlength', 3).attr('maxlength', 3);
        context.card_cvv.prop('data-length', 3).attr('data-length', 3);
    };
    this.restore_cvv_description = function(context)
    {
        var card = context.self,
            cvv_description_element  = context.wrapper.find(card.settings['card_cvv_wrapper']).find('span'),
            cvv_description_first = cvv_description_element.first(),
            cvv_description = cvv_description_first.text();

        if(!card.hasDefaultValue('cvv_description'))
            card.setDefaultValue('cvv_description', cvv_description);

        if(card.hasDefaultValue('cvv_description') && card.getDefaultValue('cvv_description') !== cvv_description){
            var description = card.getDefaultValue('cvv_description');

            cvv_description_element.each(function(i, element){
                $(element).text(description);
            });
        }
    };
};
function MomentumActivatedState()
{
    this.name = 'momentum_activated';
    this.rule = 'valid_card_number_maestro_momentum';
    this.handle = function(context)
    {
        var card = context.self;
        context.wrapper.find(card.settings['card_holder_wrapper']).show();
        context.card_holder.prop('required', false);
        context.card_number_4.prop('disabled', false).show();
        context.wrapper.find(card.settings['card_holder_not_required']).removeAttr('hidden').show();
        context.wrapper.find(card.settings['card_cvv_wrapper']).show();
        context.card_cvv.val('');
        context.wrapper.find(card.settings['if_you_have_cvv']).hide();

        card.prepareValidationRule(this.rule);
        card.addValidationRule(this.rule);
    };
};
function MomentumFilledState()
{
    this.name = 'momentum_filled';
    this.handle = function(context)
    {
        var card = context.self;
        context.card_holder.val('');
        context.card_cvv.val('123');
        context.wrapper.find(card.settings['card_holder_wrapper']).hide();
        context.wrapper.find(card.settings['card_cvv_wrapper']).hide();
        context.wrapper.find(card.settings['if_you_have_cvv']).show();
    };
};
function AmexActivatedState()
{
    this.name = 'amex_activated';
    this.rule = 'valid_card_number_amex';
    this.handle = function(context)
    {
        var lastCardInputSize = 3,
            cvvInputSize      = 4;

        context.card_number_3
            .prop('maxlength', lastCardInputSize)
            .data('length', lastCardInputSize).attr('data-length', lastCardInputSize).prop('data-length', lastCardInputSize);

        context.card_number_3.prop('placeholder', 'XXX');

        context.card_cvv
            .prop('maxlength', cvvInputSize)
            .data('length', cvvInputSize);

        this.set_cvv_description(context);

        context.self.prepareValidationRule(this.rule);
        context.self.addValidationRule(this.rule);
    };
    this.set_cvv_description = function(context)
    {
        var card = context.self,
            key = 'cvv_description',
            amex_token = 'код может быть 4-ёх значным',
            element = context.wrapper.find(card.settings['card_cvv_wrapper']).find('span:first'),
            getFirstValue = function(element){ return element.length > 1 ? element.first().text() : element.text(); },
            default_text = card.hasDefaultValue(key) ? card.getDefaultValue(key) : getFirstValue(element),
            amex_text = default_text + ' (' + amex_token + ')';

        element.each(function(i, item){
            $(item).text(amex_text);
        });
    };
};