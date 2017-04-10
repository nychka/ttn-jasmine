function PaymentCard(){
    this.active = false;
    this.momentum_nums = [63, 66, 67, 68, 69];
    this.validationRule = 'valid_card_number_maestro_momentum';
    this.cardInputWrapper = '.card-num-wrapper';
    this.firstInputSelector = '#card_number_0';

    this.getNumberInputs = function(){
        var wrapper = this.getWrapper();
        var numbers = wrapper.find(this.cardInputWrapper + ' input');
        return numbers;
    };
    this.getActiveNumberInputs = function(){
      return $(this.cardInputWrapper + ' input:visible');
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
        var numbers = $(this.cardInputWrapper + ' input');

        numbers.each(function(i, number){
          $(number).on('keyup', function(e){ self.operate(e); });
        });
    };
    this.getFirstInput = function(){
        return $(this.cardInputWrapper + ' ' + this.firstInputSelector);
    };
    this.numberStarts = function(number){
        var starts = false;
        this.momentum_nums.forEach(function(num){
            if(number.indexOf(num) == 0){
                starts = true;
                return starts;
            }
        });

        return starts;
    };
    this.setActive = function(active)
    {
        this.active = active;
    };
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
    this.bindFirstInputListener = function(){
        var self = this;
        var firstInput = $(this.cardInputWrapper + ' ' + this.firstInputSelector);
        
        firstInput.on('keyup', function(e){
            var active = self.numberStarts(e.target.value);
            
            if(active !== this.active){
              active ? self.transitToState('momentum_activated') :  self.transitToState('default');
            }
            self.setActive(active);
        });
    };
    this.addValidationRule = function(){
        this.getFirstInput()
            .addClass(this.validationRule)
            .removeClass('valid_card_number_visa_master');
    };
    this.removeValidationRule = function(){
      if(!this.getFirstInput().hasClass(this.validationRule)) return false;
        this.getFirstInput()
            .removeClass(this.validationRule)
            .addClass('valid_card_number')
            .addClass('valid_card_number_visa_master');
    };
    this.prepareValidationRule = function(){
      var self = this;

      if(typeof $.validator.methods[this.validationRule] !== 'function'){
        $.validator.addMethod(self.validationRule, function(value, element){
          var first_n = $(element).parents('.card_num').find('input:first').val().substr(0, 2);

          var matches = self.numberStarts(first_n);
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
        var selector = '.card_data';
        var blocks = $(selector);
        if(!(blocks && blocks.length)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('card_blocks')) this.card_blocks = blocks;
        
        return this.card_blocks;
    };
    this.getWrapper = function()
    {
        var selector = '.card_data',
            block = $(selector);
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
            'card_number_0':    wrapper.find('#card_number_0'),
            'card_number_1':    wrapper.find('#card_number_1'),
            'card_number_2':    wrapper.find('#card_number_2'),
            'card_number_3':    wrapper.find('#card_number_3'),
            'card_number_4':    wrapper.find('#card_number_4'),
            'card_date_month':  wrapper.find('#card_date_month'),
            'card_date_year':   wrapper.find('#card_date_year'),
            'card_holder':      wrapper.find('#card_holder'),
            'card_cvv':         wrapper.find('#card_cvv')
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
        if(!this.hasOwnProperty('states')){
            var states = { 
                'default': new DefaultState(),
                'momentum_activated': new MomentumActivatedState(),
                'momentum_filled': new MomentumFilledState()
            };
            this.states = states;
        }

        return this.states;
    };
    this.getState = function(state)
    {   
        var states = this.getAllStates();
        if(!states[state]) throw('State '+state+' not found!');

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

      wrapper.find('#if_you_have_cvv').on('click', function(e){
        e.preventDefault();
        self.transitToState('momentum_activated');
      });
    };
    this.init = function(){
      this.transitToState('default');
      this.bindListeners();
      this.bindFirstInputListener();
      this.bindLinkIfYouHaveCvv();
    };
};

function DefaultState()
{
    this.name = 'default';
    this.handle = function(context)
    {
      context['self'].removeValidationRule();
      context['card_number_4'].prop('disabled', true).val('').hide();
      context['card_holder'].prop('required', true);
      context['card_cvv'].val('');
      context['wrapper'].find('.card_owner').show();
      context['wrapper'].find('.card_cvv').show();
      context['wrapper'].find('#if_you_have_cvv').hide();
      context['wrapper'].find('#card_holder_not_required').hide();
    };
    this.getName = function()
    {
      return this.name;
    }
};
function MomentumActivatedState()
{
    this.name = 'momentum_activated';
    this.handle = function(context)
    {
      context['self'].prepareValidationRule();
      context['self'].addValidationRule();
      context['wrapper'].find('.card_owner').show();
      context['card_holder'].prop('required', false);
      context['card_number_4'].prop('disabled', false).show();
      context['wrapper'].find('#card_holder_not_required').removeAttr('hidden').show();
      context['wrapper'].find('.card_cvv').show();
      context['card_cvv'].val('');
      context['wrapper'].find('#if_you_have_cvv').hide();
    }
};
function MomentumFilledState()
{
    this.name = 'momentum_filled';
    this.handle = function(context)
    {
      context['card_holder'].val('');
      context['card_cvv'].val('123');
      context['wrapper'].find('.card_owner').hide();
      context['wrapper'].find('.card_cvv').hide();
      context['wrapper'].find('#if_you_have_cvv').show();
    };
};