function PaymentCard(){
    this.active = false;
    this.momentum_nums = [63, 66, 67, 68, 69];
    this.validationRule = 'valid_card_number_maestro_momentum';
    this.wrapper = $('.card_data:visible');
    this.cardInputWrapper = $('.card-num-wrapper:visible');

    this.getNumberInputs = function(){
        var numbers = this.wrapper.find('.card_num input:visible');
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
    this.bindListener = function(){
        var self = this;
        var numbers = this.getNumberInputs();

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
        var firstInput = this.getFirstInput();

        firstInput.on('keyup', function(e){
            var active = self.numberStarts(e.target.value);
            self.setActive(active);

            if(active){
                self.whenActive();
            }else{
                self.whenUnactive();
            }
        });

        if(this.getCount() === 18){
            // console.log('interesting things coming)))...');
            $('.card_owner').hide();
            this.disableInput($('#card_holder'));
            $('.card_cvv').hide();
            this.disableInput($('#card_cvv'));
            $('#if_you_have_cvv')
                .removeAttr('disabled')
                .show()
                .off().on('click', function(e){
                e.preventDefault();
                self.enableInput($('#card_cvv'));
                $('.card_cvv').show();
                $('#if_you_have_cvv').hide();
            });
        }else{
            // console.log('it is boring..(((');
            if($('.card_owner').is(':hidden')){
                this.enableInput($('#card_holder'));
                this.enableInput($('#card-cvv'));
                $('.card_owner').show();
                $('.card_cvv').show();
                $('#if_you_have_cvv').hide();
            }
        }
    };
    this.getAdditionalInput = function(){
        var id = '#'+ this.additionalCardNumberId;
        return this.wrapper.find(id);
    };
    this.whenUnactive = function(){
        if(this.hasAdditionalInput()){
            this.getAdditionalInput().hide().val('').prop('disabled', true);
        }
        this.removeValidationRule();
        $('#card_holder_not_required').hide();
        $('#card_holder').attr('required', 'required');
    };
    this.whenActive = function(){
        if(!this.hasAdditionalInput()){
            var input = this.addNumberInput();
            this.cardInputWrapper.append(input);
            this.additionalInput = input;
            this.fixTabIndex();
            this.prepareValidationRule();
        }else{
            if(this.getAdditionalInput().is(':hidden')){
                this.getAdditionalInput().show().prop('disabled', false);
            }
        }
        this.addValidationRule();
        $('#card_holder').removeAttr('required');
        $('#card_holder_not_required').removeAttr('hidden').show();
    };
    this.hasAdditionalInput = function(){
        return (typeof this.additionalInput === 'object');
    };
    this.fixTabIndex = function(){
        var numbers = this.getNumberInputs();
        var lastIndex = parseInt(numbers.last().attr('tabindex'));

        numbers.each(function(i, number){
            number = $(number);
            var index = parseInt(number.attr('tabindex'));
            index -= 1;
            number.attr('tabindex', index);
            number.prop('tabindex', index);
        });
    };
    this.addNumberInput = function(){
        var numbers = this.getNumberInputs();
        var input = numbers.last().clone(true);

        var tabindex = parseInt(input.attr('tabindex')) + 1;
        var id = input.attr('id').match(/\d$/).shift();
        id = parseInt(id) + 1;
        var name = 'card_number[' + id + ']';
        this.additionalCardNumberId = 'card_number_' + id;

        var attrs = {
            id: this.additionalCardNumberId,
            'data-length': 2,
            maxlength: 2,
            name: name,
            placeholder: 'XX',
            tabindex: tabindex
        };
        input.attr(attrs);

        return input;
    };
    this.addValidationRule = function(){
        this.getFirstInput()
            .addClass(this.validationRule)
            //.removeClass('valid_card_number');
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
    this.init = function(){
        this.bindListener();
    };
}