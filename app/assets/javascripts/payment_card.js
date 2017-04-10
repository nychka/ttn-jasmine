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
    this.getCount = function(){
        var count = 0;
        var numbers = this.getNumberInputs();

        numbers.each(function(i, number){
            count += number.value.length;
        });

        return count;
    };
    this.bindListeners = function(){
        var self = this;
        var numbers = $(this.cardInputWrapper + ' input');//this.getNumberInputs();
        // var numbers = this.getNumberInputs();
        console.assert(20, numbers.length);
        numbers.each(function(i, number){
            $(number).on('keyup', function(e){
                self.operate(e);
            });
        });
    };
    this.getFirstInput = function(){
        return this.getNumberInputs().first();
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
        // if(this.active !== active){
        //   console.log('MOMENTUM: ', (active ? 'ACTIVATED' : 'DEACTIVATED'));
        // }
        this.active = active;
    };
    this.disableInput = function(input)
    {
        input.val('').prop('disabled', true);
    };
    this.enableInput = function(input)
    {
        input.prop('disabled', false);
    };
    this.operate = function(e){
        var self = this;
        var count = this.getCount();
        var wrapper = this.getWrapper();

        if(this.getCount() === 18){
            console.log('interesting things coming)))...');
            wrapper.find('.card_owner').hide();
            this.disableInput(wrapper.find('#card_holder'));
            wrapper.find('.card_cvv').hide();
            this.disableInput(wrapper.find('#card_cvv'));
            wrapper.find('#if_you_have_cvv')
                .removeAttr('disabled')
                .show()
                .off().on('click', function(e){
                e.preventDefault();
                self.enableInput(wrapper.find('#card_cvv'));
                wrapper.find('.card_cvv').show();
                wrapper.find('#if_you_have_cvv').hide();
            });
        }else{
            // console.log('it is boring..(((');
            if(wrapper.find('.card_owner').is(':hidden')){
                this.enableInput(wrapper.find('#card_holder'));
                this.enableInput(wrapper.find('#card-cvv'));
                wrapper.find('.card_owner').show();
                wrapper.find('.card_cvv').show();
                wrapper.find('#if_you_have_cvv').hide();
            }
        }
    };
    this.bindFirstInputListener = function(){
        var self = this;
        var firstInput = $(this.cardInputWrapper + ' ' + this.firstInputSelector);
        
        firstInput.on('keyup', function(e){
            var active = self.numberStarts(e.target.value);
            self.setActive(active);
            
            if(active){
               console.log('----active first');
                self.whenActive();
                self.transitToState('momentum_activated');
            }else{
                console.log('----not active first');
                self.whenUnactive();
                self.transitToState('default');
            }
        });
    };
    this.getAdditionalInput = function(){
        var wrapper = this.getWrapper();
        return wrapper.find('#card_number_4');
    };
    this.whenUnactive = function(){
        this.removeValidationRule();
        var wrapper = this.getWrapper();
        wrapper.find('#card_number_4').prop('disabled', true).hide().val('');
        $('#card_holder_not_required').hide();
        $('#card_holder').attr('required', 'required');
    };
    this.whenActive = function(){
        this.prepareValidationRule();
        this.addValidationRule();
        var wrapper = this.getWrapper();
        wrapper.find('#card_number_4').prop('disabled', false).show();
        $('#card_holder').removeAttr('required');
        $('#card_holder_not_required').removeAttr('hidden').show();
    };
    this.addValidationRule = function(){
        this.getFirstInput()
            .addClass(this.validationRule)
            .removeClass('valid_card_number_visa_master');
    };
    this.removeValidationRule = function(){
        this.getFirstInput()
            .removeClass(this.validationRule)
            .addClass('valid_card_number')
            .addClass('valid_card_number_visa_master');
    };
    this.prepareValidationRule = function(){
        var self = this;

        $.validator.addMethod(self.validationRule, function(value, element){
            var first_n = $(element).parents('.card_num').find('input:first').val().substr(0, 2);

            var matches = self.numberStarts(first_n);
            if(!matches){
                $(element).parent().addClass('error');
            }

            return matches;
        }, "Please enter a valid card number. Maestro MOMENTUM");
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
        // console.log('sum', sum, 'length', numbers.length, sum % 10 == 0);
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
            block = $(selector + ':visible');
        if(!(block)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('active_wrapper')) this.active_wrapper = block;

        return this.active_wrapper;
    };
    this.switchWrapper = function(block)
    {
        if(block && (typeof block['parent'] === 'function') && block.parent().length){
            this.active_wrapper = block;
        }else{
            throw('card block you are trying to switch is not exist!');
        }
    };
    this.getContext = function()
    {
        var wrapper = this.getWrapper();
        var context = {
            'card_block':       wrapper,
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
        var state = this.getState(state);
        this.current_state = state;
    };
    this.init = function(){
        this.bindListener();
    };
};

function DefaultState()
{
    this.name = 'default';
    this.handle = function(context)
    {
        // console.log(context);debugger;
        context['card_holder'].prop('required', false);
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
        // console.log(context);debugger;
        context['card_holder'].prop('required', false);
    }
};
function MomentumFilledState()
{
    this.name = 'momentum_filled';
    this.handle = function(context)
    {
        // console.log(context);debugger;
        context['card_holder'].prop('required', false);
    }
};